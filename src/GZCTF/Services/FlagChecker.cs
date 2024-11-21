using System.Diagnostics.Metrics;
using System.Threading.Channels;
using GZCTF.Models.Internal;
using GZCTF.Repositories.Interface;
using GZCTF.Services.Cache;
using Microsoft.EntityFrameworkCore;

namespace GZCTF.Services;

public class FlagChecker(
    ChannelReader<Submission> channelReader,
    ChannelWriter<Submission> channelWriter,
    ILogger<FlagChecker> logger,
    IServiceProvider serviceProvider,
    IServiceScopeFactory serviceScopeFactory) : IHostedService
{
    CancellationTokenSource TokenSource { get; set; } = new();
    
    List<string> _fakeFlags = [];
    
    const int MaxWorkerCount = 4;

    internal static int GetWorkerCount()
    {
        // if RAM < 2GiB or CPU <= 3, return 1
        // if RAM < 4GiB or CPU <= 6, return 2
        // otherwise, return 4
        var memoryInfo = GC.GetGCMemoryInfo();
        double freeMemory = memoryInfo.TotalAvailableMemoryBytes / 1024.0 / 1024.0 / 1024.0;
        var cpuCount = Environment.ProcessorCount;

        if (freeMemory < 2 || cpuCount <= 3)
            return 1;
        if (freeMemory < 4 || cpuCount <= 6)
            return 2;
        return MaxWorkerCount;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        TokenSource = new CancellationTokenSource();

        for (var i = 0; i < GetWorkerCount(); ++i)
        {
            await Task.Factory.StartNew(() => Checker(i, TokenSource.Token), cancellationToken,
                TaskCreationOptions.LongRunning, TaskScheduler.Default);
        }

        await using AsyncServiceScope scope = serviceScopeFactory.CreateAsyncScope();
        
        if (File.Exists("/app/files/fake_flags.txt"))
            _fakeFlags = (await File.ReadAllLinesAsync("/app/files/fake_flags.txt", cancellationToken))
            .Select(t => t.Trim()).ToList();
        
        if (File.Exists("/app/files/fake_flags_used.txt"))
            (await File.ReadAllLinesAsync("/app/files/fake_flags_used.txt", cancellationToken))
                .Select(t => t.Trim()).ToList().ForEach(s => _fakeFlags.Remove(s));
        
        var submissionRepository = scope.ServiceProvider.GetRequiredService<ISubmissionRepository>();
        Submission[] flags = await submissionRepository.GetUncheckedFlags(TokenSource.Token);

        foreach (Submission item in flags)
            await channelWriter.WriteAsync(item, TokenSource.Token);

        if (flags.Length > 0)
            logger.SystemLog(Program.StaticLocalizer[nameof(Resources.Program.FlagsChecker_Recheck), flags.Length],
                TaskStatus.Pending,
                LogLevel.Debug);

        logger.SystemLog(Program.StaticLocalizer[nameof(Resources.Program.FlagsChecker_Started)], TaskStatus.Success,
            LogLevel.Debug);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        TokenSource.Cancel();

        logger.SystemLog(Program.StaticLocalizer[nameof(Resources.Program.FlagsChecker_Stopped)], TaskStatus.Exit,
            LogLevel.Debug);

        return Task.CompletedTask;
    }

    async Task Checker(int id, CancellationToken token = default)
    {
        logger.SystemLog(Program.StaticLocalizer[nameof(Resources.Program.FlagsChecker_WorkerStarted), id],
            TaskStatus.Pending,
            LogLevel.Debug);

        try
        {
            await foreach (Submission item in channelReader.ReadAllAsync(token))
            {
                logger.SystemLog(
                    Program.StaticLocalizer[nameof(Resources.Program.FlagsChecker_WorkerStartProcessing), id,
                        item.Answer],
                    TaskStatus.Pending, LogLevel.Debug);

                await using AsyncServiceScope scope = serviceScopeFactory.CreateAsyncScope();

                var cacheHelper = scope.ServiceProvider.GetRequiredService<CacheHelper>();
                var eventRepository = scope.ServiceProvider.GetRequiredService<IGameEventRepository>();
                var instanceRepository = scope.ServiceProvider.GetRequiredService<IGameInstanceRepository>();
                var gameNoticeRepository = scope.ServiceProvider.GetRequiredService<IGameNoticeRepository>();
                var submissionRepository = scope.ServiceProvider.GetRequiredService<ISubmissionRepository>();

                try
                {
                    (SubmissionType type, AnswerResult ans) = await instanceRepository.VerifyAnswer(item, token);

                    var isFakeFlag = false;
                    
                    switch (ans)
                    {
                        case AnswerResult.Expired:
                            break;
                        case AnswerResult.NotFound:
                            logger.Log(
                                Program.StaticLocalizer[nameof(Resources.Program.FlagChecker_UnknownInstance),
                                    item.TeamName,
                                    item.ChallengeName],
                                item.User,
                                TaskStatus.NotFound, LogLevel.Warning);
                            break;
                        case AnswerResult.Accepted:
                            {
                                if (_fakeFlags.Contains(item.Answer))
                                {
                                    isFakeFlag = true;
                                    logger.Log(
                                        Program.StaticLocalizer[nameof(Resources.Program.FlagChecker_CheatDetected),
                                            item.TeamName,
                                            item.ChallengeName,
                                            item.Answer],
                                        item.User, TaskStatus.Failed, LogLevel.Information);

                                    await eventRepository.AddEvent(
                                        GameEvent.FromSubmission(item, type, ans, Program.StaticLocalizer), token);
                                    
                                    _fakeFlags.Remove(item.Answer);
                                    var cheatCounter = serviceProvider.GetKeyedService<UpDownCounter<int>>(nameof(TelemetryMeters.FlagCheatedCount));
                                    cheatCounter?.Add(1,
                                        new KeyValuePair<string, object?>("id", item.Id),
                                        new KeyValuePair<string, object?>("game.id", item.GameId),
                                        new KeyValuePair<string, object?>("team.id", item.TeamId),
                                        new KeyValuePair<string, object?>("challenge.id", item.ChallengeId),
                                        new KeyValuePair<string, object?>("user.id", item.UserId),
                                        new KeyValuePair<string, object?>("time", item.SubmitTimeUtc),
                                        new KeyValuePair<string, object?>("user.name", item.UserName),
                                        new KeyValuePair<string, object?>("team.name", item.TeamName),
                                        new KeyValuePair<string, object?>("flag", item.Answer),
                                        new KeyValuePair<string, object?>("source.team.name", item.TeamName),
                                        new KeyValuePair<string, object?>("source.team.id", item.TeamId)
                                    );
                                    break;
                                }
                                logger.Log(
                                    Program.StaticLocalizer[nameof(Resources.Program.FlagChecker_AnswerAccepted),
                                        item.TeamName,
                                        item.ChallengeName,
                                        item.Answer],
                                    item.User, TaskStatus.Success, LogLevel.Information);

                                await eventRepository.AddEvent(
                                    GameEvent.FromSubmission(item, type, ans, Program.StaticLocalizer), token);

                                // only flush the scoreboard if the contest is not ended and the submission is accepted
                                if (item.Game!.EndTimeUtc > item.SubmitTimeUtc)
                                    await cacheHelper.FlushScoreboardCache(item.GameId, token);
                                break;
                            }
                        default:
                            {
                                logger.Log(
                                    Program.StaticLocalizer[nameof(Resources.Program.FlagChecker_AnswerRejected),
                                        item.TeamName,
                                        item.ChallengeName,
                                        item.Answer],
                                    item.User, TaskStatus.Failed, LogLevel.Information);

                                await eventRepository.AddEvent(
                                    GameEvent.FromSubmission(item, type, ans, Program.StaticLocalizer), token);
                                
                                if (item.GameChallenge?.CanSubmit is not true)
                                    break;
                                
                                CheatCheckInfo result = await instanceRepository.CheckCheat(item, token);
                                ans = result.AnswerResult;

                                if (ans == AnswerResult.CheatDetected)
                                {
                                    logger.Log(
                                        Program.StaticLocalizer[nameof(Resources.Program.FlagChecker_CheatDetected),
                                            item.TeamName,
                                            item.ChallengeName,
                                            result.SourceTeamName ?? ""],
                                        item.User, TaskStatus.Success, LogLevel.Information);

                                    await eventRepository.AddEvent(
                                        new()
                                        {
                                            Type = EventType.CheatDetected,
                                            Values =
                                                [item.ChallengeName, item.TeamName, result.SourceTeamName ?? ""],
                                            TeamId = item.TeamId,
                                            UserId = item.UserId,
                                            GameId = item.GameId
                                        }, token);
                                    
                                    var cheatCounter = serviceProvider.GetKeyedService<UpDownCounter<int>>(nameof(TelemetryMeters.FlagCheatedCount));
                                    cheatCounter?.Add(1,
                                        new KeyValuePair<string, object?>("id", item.Id),
                                        new KeyValuePair<string, object?>("game.id", item.GameId),
                                        new KeyValuePair<string, object?>("team.id", item.TeamId),
                                        new KeyValuePair<string, object?>("challenge.id", item.ChallengeId),
                                        new KeyValuePair<string, object?>("user.id", item.UserId),
                                        new KeyValuePair<string, object?>("time", item.SubmitTimeUtc),
                                        new KeyValuePair<string, object?>("user.name", item.UserName),
                                        new KeyValuePair<string, object?>("team.name", item.TeamName),
                                        new KeyValuePair<string, object?>("flag", item.Answer),
                                        new KeyValuePair<string, object?>("source.team.name", result.SourceTeamName),
                                        new KeyValuePair<string, object?>("source.team.id", result.SourceTeamId)
                                        );
                                }

                                break;
                            }
                    }

                    if (item.Game!.EndTimeUtc > DateTimeOffset.UtcNow
                        && type != SubmissionType.Unaccepted
                        && type != SubmissionType.Normal)
                        await gameNoticeRepository.AddNotice(
                            GameNotice.FromSubmission(item, type, Program.StaticLocalizer), token);
                    
                    item.Status = ans;
                    await submissionRepository.SendSubmission(item);
                    
                    var counter = serviceProvider.GetKeyedService<UpDownCounter<int>>(nameof(TelemetryMeters.FlagCheckedCount));
                    counter?.Add(1, 
                        new KeyValuePair<string, object?>("id", item.Id),
                        new KeyValuePair<string, object?>("game.id", item.GameId),
                        new KeyValuePair<string, object?>("team.id", item.TeamId),
                        new KeyValuePair<string, object?>("challenge.id", item.ChallengeId),
                        new KeyValuePair<string, object?>("user.id", item.UserId),
                        new KeyValuePair<string, object?>("time", item.SubmitTimeUtc),
                        new KeyValuePair<string, object?>("user.name", item.UserName),
                        new KeyValuePair<string, object?>("team.name", item.TeamName),
                        new KeyValuePair<string, object?>("status", isFakeFlag ? AnswerResult.CheatDetected : ans),
                        new KeyValuePair<string, object?>("flag", item.Answer)
                        );
                }
                catch (DbUpdateConcurrencyException)
                {
                    logger.SystemLog(
                        Program.StaticLocalizer[nameof(Resources.Program.FlagChecker_ConcurrencyFailed), item.Id],
                        TaskStatus.Failed,
                        LogLevel.Warning);
                    await channelWriter.WriteAsync(item, token);
                }
                catch (Exception e)
                {
                    logger.SystemLog(
                        Program.StaticLocalizer[nameof(Resources.Program.FlagsChecker_WorkerExceptionOccurred), id],
                        TaskStatus.Failed,
                        LogLevel.Debug);
                    logger.LogError(e.Message, e);
                }

                token.ThrowIfCancellationRequested();
            }
        }
        catch (OperationCanceledException)
        {
            logger.SystemLog(Program.StaticLocalizer[nameof(Resources.Program.FlagsChecker_WorkerCancelled), id],
                TaskStatus.Exit,
                LogLevel.Debug);
        }
        finally
        {
            logger.SystemLog(Program.StaticLocalizer[nameof(Resources.Program.FlagsChecker_WorkerStopped), id],
                TaskStatus.Exit,
                LogLevel.Debug);
        }
    }
}
