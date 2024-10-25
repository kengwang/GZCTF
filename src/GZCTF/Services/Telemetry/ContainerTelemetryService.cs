using System.Diagnostics.Metrics;
using GZCTF.Models.Internal;
using GZCTF.Services.Container.Manager;

namespace GZCTF.Services.Telemetry;

public class ContainerTelemetryService(
    IContainerManager manager,
    [FromKeyedServices(nameof(TelemetryMeters.ContainerCount))] UpDownCounter<int> counter)
    : IContainerManager
{
    
    public async Task<Models.Data.Container?> CreateContainerAsync(ContainerConfig config,
        CancellationToken token = default)
    {
        var container = await manager.CreateContainerAsync(config, token);
        counter.Add(1,
            new KeyValuePair<string, object?>("image", config.Image),
            new KeyValuePair<string, object?>("teamId", config.TeamId),
            new KeyValuePair<string, object?>("challengeId", config.ChallengeId),
            new KeyValuePair<string, object?>("userId", config.UserId),
            new KeyValuePair<string, object?>("exposedPort", config.ExposedPort),
            new KeyValuePair<string, object?>("flag", config.Flag),
            new KeyValuePair<string, object?>("enableTrafficCapture", config.EnableTrafficCapture),
            new KeyValuePair<string, object?>("memoryLimit", config.MemoryLimit),
            new KeyValuePair<string, object?>("cpuCount", config.CPUCount),
            new KeyValuePair<string, object?>("storageLimit", config.StorageLimit),
            new KeyValuePair<string, object?>("container_id", container?.ContainerId),
            new KeyValuePair<string, object?>("container_status", container?.Status),
            new KeyValuePair<string, object?>("container_image", container?.Image),
            new KeyValuePair<string, object?>("container_startAt", container?.StartedAt),
            new KeyValuePair<string, object?>("container_expectStopAt", container?.ExpectStopAt),
            new KeyValuePair<string, object?>("container_localPort", container?.Port),
            new KeyValuePair<string, object?>("container_publicPort", container?.PublicPort),
            new KeyValuePair<string, object?>("container_ip", container?.IP),
            new KeyValuePair<string, object?>("container_challengeId", container?.GameInstance?.ChallengeId),
            new KeyValuePair<string, object?>("container_teamId", container?.GameInstance?.Participation.TeamId),
            new KeyValuePair<string, object?>("container_gameId", container?.GameInstance?.Participation.GameId)
            );
            
        return container;
    }

    public async Task DestroyContainerAsync(Models.Data.Container container, CancellationToken token = default)
    {
        await manager.DestroyContainerAsync(container, token);
        counter.Add(-1,
            new KeyValuePair<string, object?>("container_id", container.ContainerId),
            new KeyValuePair<string, object?>("container_status", container.Status),
            new KeyValuePair<string, object?>("container_image", container.Image),
            new KeyValuePair<string, object?>("container_startAt", container.StartedAt),
            new KeyValuePair<string, object?>("container_expectStopAt", container.ExpectStopAt),
            new KeyValuePair<string, object?>("container_localPort", container.Port),
            new KeyValuePair<string, object?>("container_publicPort", container.PublicPort),
            new KeyValuePair<string, object?>("container_ip", container.IP),
            new KeyValuePair<string, object?>("container_challengeId", container.GameInstance?.ChallengeId),
            new KeyValuePair<string, object?>("container_teamId", container.GameInstance?.Participation.TeamId),
            new KeyValuePair<string, object?>("container_gameId", container.GameInstance?.Participation.GameId)
            );
    }
}