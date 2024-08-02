import dayjs from 'dayjs'
import { GameStatus } from '@Components/GameCard'
import { OnceSWRConfig } from '@Utils/useConfig'
import api, { ChallengeInfo, ChallengeTag, DetailedGameInfoModel, ParticipationStatus, ScoreboardItem, ScoreboardModel, SubmissionType } from '@Api'

export const getGameStatus = (game?: DetailedGameInfoModel) => {
  const startTime = dayjs(game?.start)
  const endTime = dayjs(game?.end)

  const total = endTime.diff(startTime, 'minute')
  const current = dayjs().diff(startTime, 'minute')

  const finished = dayjs().isAfter(endTime)
  const started = dayjs().isAfter(startTime)
  const progress = started ? (finished ? 1 : current / total) : 0
  const status = started ? (finished ? GameStatus.Ended : GameStatus.OnGoing) : GameStatus.Coming

  return {
    startTime,
    endTime,
    finished,
    started,
    progress: progress * 100,
    total,
    status,
  }
}

export const useGame = (numId: number) => {
  const { data: game, error, mutate } = api.game.useGameGames(numId, OnceSWRConfig)

  return { game, error, mutate, status: game?.status ?? ParticipationStatus.Unsubmitted }
}

export const useGameScoreboard = (numId: number) => {
  const { game } = useGame(numId)
  const { status } = getGameStatus(game)

  const {
    data: scoreboard,
    error,
    mutate,
  } = api.game.useGameScoreboard(numId, {
    ...OnceSWRConfig,
    refreshInterval: status === GameStatus.OnGoing ? 30 * 1000 : 0,
  })

  return { scoreboard, error, mutate }
}

export const useGameTeamInfo = (numId: number) => {
  const { game } = useGame(numId)
  const { status } = getGameStatus(game)

  const {
    data: teamInfo,
    error,
    mutate,
  } = api.game.useGameChallengesWithTeamInfo(numId, {
    ...OnceSWRConfig,
    shouldRetryOnError: false,
    refreshInterval: status === GameStatus.OnGoing ? 10 * 1000 : 0,
  })

  return { teamInfo, error, mutate }
}

export const generateCustomScoreboard = (
  scoreboard: ScoreboardModel | undefined,
  organization: string = 'all',
  titlePattern: string = '',
  category: ChallengeTag | null = null,
) => {
  if (!scoreboard || !scoreboard.items || !scoreboard.challenges)
    return { items: null, challenges: null }

  // 先筛选组织，因为不用重新算，减少计算量
  const items = organization === 'all'
    ? scoreboard.items
    : scoreboard.items.filter((s) => s.organization === organization)

  console.log('genCustomScoreboard', organization, titlePattern, category)
  const pattern = titlePattern !== '' ? new RegExp(titlePattern, 'i') : null

  // 不筛选或只筛选组织：直接出结果
  if (pattern === null && category === null)
    return { items, challenges: scoreboard.challenges }

  // 正则匹配次数不需多于题目数量
  const includeChallengeIds: number[] = []
  const challenges: Record<string, ChallengeInfo[]> = {}
  for (const [tag, challs] of Object.entries(scoreboard.challenges)) {
    if (category !== null && category !== tag as ChallengeTag) continue
    const filteredChalls = challs.filter((c) => {
      if (!c.title || !c.id || pattern !== null && !pattern.test(c.title)) return false
      includeChallengeIds.push(c.id)
      return true
    })
    if (filteredChalls.length > 0) challenges[tag] = filteredChalls
  }
  // ChallengeInfo 数组是新的，但每个 ChallengeInfo 对象是原来的引用，不会修改所以不需要深拷贝 
  // 至此 includeChallengeIds 与 challenges 赋值完成

  // 对于 items：
  // 第一步筛选 item.challenges，统计分数，更新 score 和 solvedCount
  // 不管 lastSubmissionTime 因为它是字符串，比较耗时
  const copiedItems: ScoreboardItem[] = []
  items.forEach((item) => {
    const newItem = {
      ...item,
      challenges: item.challenges?.filter((c) => c.id && includeChallengeIds.includes(c.id)) ?? [],
      score: 0,
      solvedCount: 0,
    }
    console.log('222', newItem)
    newItem.challenges.forEach((c) => {
      if (c.type && c.type !== SubmissionType.Unaccepted) {
        newItem.score! += (c.score ?? 0)
        newItem.solvedCount! += 1
      }
    })
    console.log('333', newItem)
    copiedItems.push(newItem)
  })
  // item 是新的，但每个 ChallengeItem 对象是原来的引用

  // 第二步排序，只按分数排，同分则不稳定；更新 rank 和 organizationRank
  copiedItems.sort((a, b) => b.score! - a.score!)
  const currentOrgRanks: Record<string, number> = {}
  copiedItems.forEach((item, i) => {
    item.rank = i + 1
    if (item.organization) {
      if (currentOrgRanks[item.organization] === undefined)
        currentOrgRanks[item.organization] = 0
      item.organizationRank = ++currentOrgRanks[item.organization]
    }
  })

  console.log('genCustomScoreboard', copiedItems, challenges)

  return { items: copiedItems, challenges }
}
