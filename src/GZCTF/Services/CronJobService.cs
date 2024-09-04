using System.Threading.Channels;
using GZCTF.Repositories;
using GZCTF.Repositories.Interface;
using GZCTF.Services.Cache;
using Microsoft.Extensions.Caching.Distributed;

namespace GZCTF.Services;

public class CronJobService(IServiceScopeFactory provider, ILogger<CronJobService> logger) : IHostedService, IDisposable
{
    Timer? _timer;
    bool _isFinished = true;

    public void Dispose()
    {
        _timer?.Dispose();
        GC.SuppressFinalize(this);
    }

    public Task StartAsync(CancellationToken token)
    {
        _timer = new Timer(Execute, null, TimeSpan.Zero, TimeSpan.FromSeconds(30));
        logger.SystemLog(Program.StaticLocalizer[nameof(Resources.Program.CronJob_Started)], TaskStatus.Success,
            LogLevel.Debug);
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken token)
    {
        _timer?.Change(Timeout.Infinite, 0);
        logger.SystemLog(Program.StaticLocalizer[nameof(Resources.Program.CronJob_Stopped)], TaskStatus.Exit,
            LogLevel.Debug);
        return Task.CompletedTask;
    }

    async Task ContainerChecker(AsyncServiceScope scope)
    {
        var containerRepo = scope.ServiceProvider.GetRequiredService<IContainerRepository>();

        foreach (Models.Data.Container container in await containerRepo.GetDyingContainers())
        {
            await containerRepo.DestroyContainer(container);
            logger.SystemLog(
                Program.StaticLocalizer[nameof(Resources.Program.CronJob_RemoveExpiredContainer),
                    container.ContainerId],
                TaskStatus.Success, LogLevel.Debug);
        }
    }

    async Task BootstrapCache(AsyncServiceScope scope)
    {
        var gameRepo = scope.ServiceProvider.GetRequiredService<IGameRepository>();
        var upcoming = await gameRepo.GetUpcomingGames();

        if (upcoming.Length <= 0)
            return;

        var channelWriter = scope.ServiceProvider.GetRequiredService<ChannelWriter<CacheRequest>>();
        var cache = scope.ServiceProvider.GetRequiredService<IDistributedCache>();

        foreach (var game in upcoming)
        {
            var key = CacheKey.ScoreBoard(game);
            var value = await cache.GetAsync(key);
            if (value is not null)
                continue;

            await channelWriter.WriteAsync(ScoreboardCacheHandler.MakeCacheRequest(game));
            logger.SystemLog(Program.StaticLocalizer[nameof(Resources.Program.CronJob_BootstrapRankingCache), key],
                TaskStatus.Success,
                LogLevel.Debug);
        }
    }

    async Task UpdateChallengeStatus(AsyncServiceScope scope)
    {
        var gamesRepository = scope.ServiceProvider.GetRequiredService<IGameRepository>();
        var challengesRepository = scope.ServiceProvider.GetRequiredService<IGameChallengeRepository>();
        var gameNoticeRepository = scope.ServiceProvider.GetRequiredService<IGameNoticeRepository>();
        var cacheHelper = scope.ServiceProvider.GetRequiredService<CacheHelper>();
        var games = await gamesRepository.GetGames();
        
        foreach (Game game in games)
        {
            bool hasChanged = false;
            var challenges = await challengesRepository.GetChallenges(game.Id);
            foreach (GameChallenge gameChallenge in challenges)
            {
                if (gameChallenge.EnableAt is null && gameChallenge.EndAt is null)
                    continue;
                
                if (gameChallenge.EnableAt <= DateTimeOffset.UtcNow &&
                    gameChallenge.EndAt > DateTimeOffset.UtcNow &&
                    !gameChallenge.IsEnabled)
                {
                    gameChallenge.IsEnabled = true;
                    await challengesRepository.EnsureInstances(gameChallenge, game);
                    hasChanged = true;
                    if (game.IsActive)
                        await gameNoticeRepository.AddNotice(
                            new() { Game = game, Type = NoticeType.NewChallenge, Values = [gameChallenge.Title] }); 
                }
                
                if (!gameChallenge.IsEnabled)
                    continue;

                if (gameChallenge.EndAt <= DateTimeOffset.UtcNow)
                {
                    gameChallenge.CanSubmit = false;
                }
                
            }
            if (hasChanged)
                await cacheHelper.FlushScoreboardCache(game.Id, CancellationToken.None);
        }
        await gamesRepository.SaveAsync();
    }

    int _counter;
    
    async void Execute(object? state)
    {
        if (!_isFinished)
            return;
        _isFinished = false;
        try
        {
            await using AsyncServiceScope scope = provider.CreateAsyncScope();
            await UpdateChallengeStatus(scope);
            _isFinished = true;
            if (--_counter > 0) return;
            await ContainerChecker(scope);
            await BootstrapCache(scope);
            _counter = 6;
        }
        catch
        {
            // ignore
        }
        finally
        {
            _isFinished = true;
        }

    }
}
