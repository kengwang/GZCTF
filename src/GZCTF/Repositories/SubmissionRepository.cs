using System.Threading.Channels;
using GZCTF.Extensions;
using GZCTF.Hubs;
using GZCTF.Hubs.Clients;
using GZCTF.Repositories.Interface;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GZCTF.Repositories;

public class SubmissionRepository(
    IHubContext<MonitorHub, IMonitorClient> hub,
    ChannelWriter<Submission> channelWriter,
    AppDbContext context) : RepositoryBase(context), ISubmissionRepository
{
    public async Task<Submission> AddSubmission(Submission submission, CancellationToken token = default)
    {
        await Context.AddAsync(submission, token);
        await Context.SaveChangesAsync(token);

        return submission;
    }

    public Task<Submission?> GetSubmission(int gameId, int challengeId, Guid userId, int submitId,
        CancellationToken token = default)
        => Context.Submissions.Where(s =>
                s.Id == submitId && s.UserId == userId && s.GameId == gameId && s.ChallengeId == challengeId)
            .SingleOrDefaultAsync(token);

    public async Task RecalculateChallenge(int gameId, int challengeId, CancellationToken token = default)
    {
        await Context.GameInstances
            .IgnoreAutoIncludes()
            .Include(t=>t.Challenge)
            .Where(i => i.Challenge.GameId == gameId && i.ChallengeId == challengeId)
            .ExecuteUpdateAsync(g => g.SetProperty(i => i.IsSolved, false),
                cancellationToken: token);
        
        await Context.Submissions
            .IgnoreAutoIncludes()
            .Where(s => s.GameId == gameId && s.ChallengeId == challengeId)
            .ExecuteUpdateAsync(s => s.SetProperty(submission => submission.Status, AnswerResult.FlagSubmitted),
                cancellationToken: token);
        
        var allSubmissions = await Context.Submissions
            .AsNoTracking()
            .Where(s => s.GameId == gameId && s.ChallengeId == challengeId)
            .ToArrayAsync(token);
        
        foreach (var submission in allSubmissions)
        {
            await channelWriter.WriteAsync(submission, token);
        }
        
    }

    public Task<Submission[]> GetUncheckedFlags(CancellationToken token = default) =>
        Context.Submissions.Where(s => s.Status == AnswerResult.FlagSubmitted)
            .AsNoTracking().Include(e => e.Game).ToArrayAsync(token);

    public Task<Submission[]> GetSubmissions(Game game, AnswerResult? type = null, int count = 100, int skip = 0,
        CancellationToken token = default) =>
        GetSubmissionsByType(type).Where(s => s.Game == game).TakeAllIfZero(count, skip).ToArrayAsync(token);

    public Task<Submission[]> GetSubmissions(GameChallenge challenge, AnswerResult? type = null, int count = 100,
        int skip = 0, CancellationToken token = default) =>
        GetSubmissionsByType(type).Where(s => s.GameChallenge == challenge).TakeAllIfZero(count, skip)
            .ToArrayAsync(token);

    public Task<Submission[]> GetSubmissions(Participation team, AnswerResult? type = null, int count = 100,
        int skip = 0, CancellationToken token = default) =>
        GetSubmissionsByType(type).Where(s => s.TeamId == team.TeamId).TakeAllIfZero(count, skip)
            .ToArrayAsync(token);

    public Task SendSubmission(Submission submission)
        => hub.Clients.Group($"Game_{submission.GameId}").ReceivedSubmissions(submission);

    IQueryable<Submission> GetSubmissionsByType(AnswerResult? type = null)
    {
        IQueryable<Submission> subs = type is not null
            ? Context.Submissions.Where(s => s.Status == type.Value)
            : Context.Submissions;

        return subs.OrderByDescending(s => s.SubmitTimeUtc);
    }
}
