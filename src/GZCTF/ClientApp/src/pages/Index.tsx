import { Group, Stack, Title, useMantineTheme, Image, Alert, Text, Anchor } from '@mantine/core'
import { mdiFlagCheckered } from '@mdi/js'
import { Icon } from '@mdi/react'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import MobilePostCard from '@Components/MobilePostCard'
import PostCard from '@Components/PostCard'
import RecentGame from '@Components/RecentGame'
import RecentGameCarousel from '@Components/RecentGameCarousel'
import WithNavBar from '@Components/WithNavbar'
import { showErrorNotification } from '@Utils/ApiHelper'
import { useIsMobile } from '@Utils/ThemeOverride'
import { usePageTitle } from '@Utils/usePageTitle'
import api, { PostInfoModel, GameJoinModel, ParticipationStatus } from '@Api'
import classes from './Index.module.css'
import { useNavigate } from 'react-router-dom'
import '../styles/components/index.css'
import CountdownTimer from './CountdownTimer'
import { useScrollIntoView } from '@mantine/hooks'
import { useModals } from '@mantine/modals'
import { Trans } from 'react-i18next'
import { showNotification } from '@mantine/notifications'
import { mdiAlertCircle, mdiCheck, mdiFlagOutline, mdiTimerSand } from '@mdi/js'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GameJoinModal from '@Components/GameJoinModal'
import GameProgress from '@Components/GameProgress'
import Markdown from '@Components/MarkdownRenderer'
import { useLanguage } from '@Utils/I18n'
import { getGameStatus, useGame } from '@Utils/useGame'
import { useTeams, useUser } from '@Utils/useUser'

const Home: FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  const { data: posts, mutate } = api.info.useInfoGetLatestPosts({
    refreshInterval: 5 * 60 * 1000,
  })

  const { data: allGames } = api.game.useGameGamesAll({
    refreshInterval: 5 * 60 * 1000,
  })

  allGames?.sort((a, b) => new Date(a.end!).getTime() - new Date(b.end!).getTime())

  const onTogglePinned = (post: PostInfoModel, setDisabled: (value: boolean) => void) => {
    setDisabled(true)
    api.edit
      .editUpdatePost(post.id, { title: post.title, isPinned: !post.isPinned })
      .then((res) => {
        if (post.isPinned) {
          mutate([
            ...(posts?.filter((p) => p.id !== post.id && p.isPinned) ?? []),
            { ...res.data },
            ...(posts?.filter((p) => p.id !== post.id && !p.isPinned) ?? []),
          ])
        } else {
          mutate([
            { ...res.data },
            ...(posts?.filter((p) => p.id !== post.id && p.isPinned) ?? []),
            ...(posts?.filter((p) => p.id !== post.id && !p.isPinned) ?? []),
          ])
        }
        api.info.mutateInfoGetPosts()
      })
      .catch((e) => showErrorNotification(e, t))
      .finally(() => {
        setDisabled(false)
      })
  }

  const now = new Date()
  const recentGames = [
    ...(allGames?.filter((g) => now < new Date(g.end ?? '')) ?? []),
    ...(allGames?.filter((g) => now >= new Date(g.end ?? '')).reverse() ?? []),
  ].slice(0, 3)

  const theme = useMantineTheme()
  const isMobile = useIsMobile(900)

  usePageTitle()
  const modals = useModals()

  const onJoin = () =>
    modals.openConfirmModal({
      title: t('game.content.join.confirm'),
      children: (
        <Stack gap="xs">
          <Text size="sm">{t('game.content.join.content.0')}</Text>
          <Text size="sm">
            <Trans i18nKey="game.content.join.content.1" />
          </Text>
          <Text size="sm">
            <Trans i18nKey="game.content.join.content.2" />
          </Text>
        </Stack>
      ),
      onConfirm: () => setJoinModalOpen(true),
      confirmProps: { color: theme.primaryColor },
    })

  const { id } = useParams()
  const numId = parseInt(id ?? '-1')


  // const GetAlert = () => {

  const { game, error, status } = useGame(numId)
  const { startTime, endTime, finished, started, progress } = getGameStatus(game)

  const { locale } = useLanguage()

  const { user } = useUser()
  const { teams } = useTeams()
  // console.log(finished, user, teams, ParticipationStatus, status);
  const teamRequire =
    user && status === ParticipationStatus.Unsubmitted && !finished && teams && teams.length === 0
  // }

  // GetAlert()

  const onSubmitJoin = async (info: GameJoinModel) => {
    try {
      if (!numId) return

      await api.game.gameJoinGame(numId, info)
      showNotification({
        color: 'teal',
        message: t('game.notification.joined'),
        icon: <Icon path={mdiCheck} size={1} />,
      })
      mutate()
    } catch (err) {
      return showErrorNotification(err, t)
    }
  }

  return (
    <WithNavBar minWidth={0} withFooter withHeader stickyHeader>
      <Stack justify="flex-start">
        {isMobile && recentGames && recentGames.length > 0 && (
          <RecentGameCarousel games={recentGames} />
        )}
        <div className='home'>
          <div className="centent">
            <div className="titleCenter">
              <div className='titleBg'></div>
              <div>比赛须知</div>
            </div>
            <div>
              <div style={{ marginTop: "50px" }} className='centent-introduce'>
                <div className='centent-introduce-top'>
                  <div className='centent-introduce-icon'>
                    <div className='centent-introduce-icon-img'></div>
                  </div>
                  <div className='centent-introduce-name'>
                    比赛介绍
                  </div>
                </div>
                <div className='centent-introduce-centent'>
                  <div className='centent-introduce-centent-detail'>“源鲁杯”高校网络安全技能大赛是由山东源鲁信息科技有限公司举办的网络安全公开赛事，采用线上CTF解题赛的形式进行。大赛旨在为高校学生提供展示才华和交流学习的平台，重点考核参赛选手的实战能力，致力于发现和培养网络安全领域的高、精、尖人才。</div>
                </div>
              </div>
              <div className='centent-introduce'>
                <div className='centent-introduce-top'>
                  <div className='centent-introduce-icon'>
                    <div className='centent-format-icon-img'></div>
                  </div>
                  <div className='centent-introduce-name'>
                    赛制信息
                  </div>
                </div>
                <div className='centent-format-centent'>
                  <div className='centent-format-centent-detail'>
                    <div>比赛时间：10月10日-10月23日</div>
                    <div>报名时间：09月01日-10月23日（比赛期间可随时报名参赛）</div>
                    <div>比赛方式：线上个人赛 <span style={{ marginLeft: '20px' }}>比赛方向：Web / Re / Pwn / Crypto / Misc</span></div>
                    <div>比赛赛道：本次比赛设立两个赛道，内部赛道与公开赛道。两个赛道将采用相同的比赛赛题，并分别设立独立的奖项，以确保各赛道的公平性和竞争性。</div>
                    <div>内部赛道：面向山东省内高校23、24级学生，高校社团（或校队）负责人可联系主办方申请开通内部赛道，内部赛道报名选手需提供相关信息，审核通过可进行参赛。</div>
                    <div>公开赛道：面向全国所有院校学生，可直接注册队伍进行参赛。</div>
                  </div>
                </div>
              </div>
              <div className='centent-introduce'>
                <div className='centent-introduce-top'>
                  <div className='centent-introduce-icon'>
                    <div className='centent-medal-icon-img'></div>
                  </div>
                  <div className='centent-introduce-name'>
                    奖项设置
                  </div>
                </div>
                <div className='centent-medal-centent'>
                  <div className='centent-medal-centent-detail'>
                    <span>内部赛道：一等奖2名  /  ​二等奖12名  /  三等奖24名 </span>     <span className='centent-medal-centent-detail-tow'> 公开赛道：一等奖1名  /  二等奖6名  /  三等奖12名</span>
                  </div>
                </div>
              </div>
              <div className='centent-introduce'>
                <div className='centent-introduce-top'>
                  <div className='centent-introduce-icon'>
                    <div className='centent-match-icon-img'></div>
                  </div>
                  <div className='centent-introduce-name'>
                    赛事声明
                  </div>
                </div>
                <div className='centent-match-centent'>
                  <div className='centent-match-centent-detail'>
                    <div>1. 禁止所有破坏比赛公平公正的行为，包括但不限于：比赛结束前公开平台发布解题思路、传播flag、对比赛平台参赛选手进行攻击，一经发现将被取消比赛资格。</div>
                    <div>2. 本次比赛面向全国各大高校，所有获奖选手需提供相关的在校证明材料。若无法提供或证明材料不符合要求，将取消其获奖资格，并将名额顺延至下一位符合条件的选手。</div>
                    <div>3. 参赛选手需在比赛结束后指定时间内提交比赛的WP，未按要求提交WP者，将视为放弃此次比赛成绩。 </div>
                    <div>4. 赛事的最终解释权归山东源鲁信息科技有限公司所有。</div>
                  </div>
                </div>
              </div>
              <div className='centent-introduce'>
                <div className='centent-introduce-top'>
                  <div className='centent-introduce-icon'>
                    <div className='centent-company-icon-img'></div>
                  </div>
                  <div className='centent-introduce-name'>
                    主办单位
                  </div>
                </div>
                <div className='centent-company-centent'>
                  <div className='centent-company-centent-detail'>
                    山东源鲁信息科技有限公司
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* <div>

        </div> */}
          <Stack align="center">
            <Group wrap="nowrap" gap={4} justify="space-between" align="flex-start" w="100%">
              {/* <Stack className={classes.posts}>
              {isMobile
                ? posts?.map((post) => (
                    <MobilePostCard key={post.id} post={post} onTogglePinned={onTogglePinned} />
                  ))
                : posts?.map((post) => (
                    <PostCard key={post.id} post={post} onTogglePinned={onTogglePinned} />
                  ))}
            </Stack> */}
              {!isMobile && (
                // <nav className={classes.wrapper}>
                <div className='Participate'>
                  {recentGames.length!=0&&(recentGames[0].poster != '' ? <Image src={recentGames[0].poster} className='Participate-img' alt="poster" /> : <div className='Participate-img'><Icon
                    path={mdiFlagCheckered}
                    size={1.5}
                    color={theme.colors[theme.primaryColor][4]}
                  /></div>)}
                  <CountdownTimer></CountdownTimer>
                  {/* <Stack> */}
                  {/* <Group>
                      <Icon
                        path={mdiFlagCheckered}
                        size={1.5}
                        color={theme.colors[theme.primaryColor][4]}
                      />
                      <Title order={3}>{t('common.content.home.recent_games')}</Title>
                    </Group> */}
                  {finished && <div className='button' onClick={() => navigate(`/games/${numId}/challenges`)}>进入比赛</div>}
                  {teamRequire && !finished ? <div className='button' style={{ backgroundColor: '#ccc' }}>立即参赛</div> : <div className='button' onClick={onJoin}>立即参赛</div>}
                  <div style={{ marginTop: "5%" }}>
                    {/* </Stack> */}
                    {teamRequire && (
                      <Alert
                        color="#7B66FF"
                        icon={<Icon path={mdiAlertCircle} />}
                        title={t('game.participation.alert.team_required.title')}
                      >
                        <div style={{ color: '#000',fontSize:'0.75vw'}}>
                          你没有加入任何队伍，请在
                          <Anchor style={{fontSize:'0.75vw'}} component={Link} to="/teams">
                            队伍管理
                          </Anchor>
                          页面创建、加入队伍。
                        </div>

                      </Alert>
                    )}
                    {status === ParticipationStatus.Accepted && !started && (
                      <Alert
                        color="#F5F5F5"
                        icon={<Icon path={mdiCheck} />}
                        title={t('game.participation.alert.not_started.title')}
                      >
                        {t('game.participation.alert.not_started.content', {
                          team: game?.teamName ?? '',
                        })}
                        {isMobile && t('game.participation.alert.not_started.mobile')}
                      </Alert>
                    )}
                  </div>
                  <div className='communication'>
                    <div>
                      赛事交流：
                    </div>
                    <div className='communication-centent'>
                      <div style={{ display: "flex", alignItems: 'center' }}>
                        <div className='communication-centent-img1'></div>
                        <div className='communication-centent-text'>
                          <div>赛事qq群</div>
                          <div>437096728</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: 'center' }}>
                        <div className='communication-centent-img2'></div>
                        <div className='communication-centent-text'>
                          <div>赛事组邮箱</div>
                          <div>ctf@yuanloo.com</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                // </nav>
              )}
            </Group>
          </Stack>
        </div>
      </Stack>
      <GameJoinModal
        title={t('game.content.join.title')}
        opened={joinModalOpen}
        withCloseButton={false}
        onClose={() => setJoinModalOpen(false)}
        onSubmitJoin={onSubmitJoin}
      />
    </WithNavBar>
  )
}

export default Home
