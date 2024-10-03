import {
  Card,
  Center,
  Divider,
  Group,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { mdiFlagOutline } from '@mdi/js'
import dayjs from 'dayjs'
import React, { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import Empty from '@Components/Empty'
import GameChallengeModal from '@Components/GameChallengeModal'
import { useChallengeCategoryLabelMap, SubmissionTypeIconMap } from '@Utils/Shared'
import { useGame, useGameTeamInfo } from '@Utils/useGame'
import { ChallengeInfo, ChallengeCategory, SubmissionType } from '@Api'
import classes from '@Styles/ChallengePanel.module.css'
import { useUser } from '@Utils/useUser'
import MobileChallengeCard from './MobileChallengeCard'

const MobileChallengePanel: FC = () => {
  const { id } = useParams()
  const numId = parseInt(id ?? '-1')

  const { teamInfo } = useGameTeamInfo(numId)
  const challenges = teamInfo?.challenges

  const { game } = useGame(numId)
  const { user } = useUser()

  const [searchText, setSearchText] = useLocalStorage({
    key: 'challenge-search-pattern',
    defaultValue: '',
    getInitialValueInEffect: true,
  })
  const [searchPattern, setSearchPattern] = useState<RegExp | null>(null)

  const allChallenges = Object.values(challenges ?? {}).flat()
  const searchedChallenges = allChallenges.filter(
      (chal) => !searchPattern || chal.title && searchPattern.test(chal.title)
    )
  const currentChallenges = searchedChallenges.length ? searchedChallenges : allChallenges

  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null)
  const [detailOpened, setDetailOpened] = useState(false)
  const { iconMap, colorMap } = SubmissionTypeIconMap(0.8)
  const challengeCategoryLabelMap = useChallengeCategoryLabelMap()
  const { t } = useTranslation()

  useEffect(() => {
    try {
      setSearchPattern(searchText.trim() ? new RegExp(searchText.trim(), 'i') : null)
    } catch {
      setSearchPattern(null)
    }
  }, [searchText])

  // skeleton for loading
  if (!challenges) {
    return (
      <SimpleGrid
        w="100%"
        spacing="sm"
        cols={1}
      >
        {Array(13)
          .fill(null)
          .map((_v, i) => (
            <Card key={i} radius="md" shadow="sm">
              <Stack gap="sm" pos="relative" style={{ zIndex: 99 }}>
                <Skeleton height="1.5rem" width="70%" mt={4} />
                <Divider />
                <Group wrap="nowrap" justify="space-between" align="start">
                  <Center>
                    <Skeleton height="1.5rem" width="5rem" />
                  </Center>
                  <Stack gap="xs">
                    <Skeleton height="1rem" width="6rem" mt={5} />
                    <Group justify="center" gap="md" h={20}>
                      <Skeleton height="1.2rem" width="1.2rem" />
                      <Skeleton height="1.2rem" width="1.2rem" />
                      <Skeleton height="1.2rem" width="1.2rem" />
                    </Group>
                  </Stack>
                </Group>
              </Stack>
            </Card>
          ))}
      </SimpleGrid>
    )
  }

  if (allChallenges.length === 0) {
    return (
      <Center h="calc(100vh - 12rem)" w="100%">
        <Empty
          bordered
          description={t('game.content.no_challenge')}
          fontSize="xl"
          mdiPath={mdiFlagOutline}
          iconSize={8}
        />
      </Center>
    )
  }

  return (
    <>
      <Stack w="100%" h="100%">
        <TextInput
          placeholder={t('game.placeholder.challenge_search')}
          value={searchText}
          error={searchText.trim() !== '' && (!searchPattern || searchedChallenges.length === 0)}
          onChange={(e) => setSearchText(e.currentTarget.value)}
        />
        <ScrollArea
          h="calc(100dvh - 12rem)"
          pos="relative"
          offsetScrollbars
          scrollbarSize={4}
          classNames={{ root: classes.scrollArea }}
        >
          {currentChallenges && currentChallenges.length ? (
            <SimpleGrid
              w="100%"
              spacing="xs"
              cols={1}
            >
              {currentChallenges?.map((chal) => {
                const status = teamInfo?.rank?.solvedChallenges?.find((c) => c.id === chal.id)?.type
                const solved = status !== SubmissionType.Unaccepted && status !== undefined

                return (
                  <MobileChallengeCard
                    key={chal.id}
                    challenge={chal}
                    iconMap={iconMap}
                    colorMap={colorMap}
                    onClick={() => {
                      setChallenge(chal)
                      setDetailOpened(true)
                    }}
                    solved={solved}
                    teamId={teamInfo?.rank?.id}
                  />
                )
              })}
            </SimpleGrid>
          ) : (
            <Center h="calc(100dvh - 10rem)">
              <Stack gap={0}>
                <Title order={2}>{t('game.content.all_solved.title')}</Title>
                <Text>{t('game.content.all_solved.comment')}</Text>
              </Stack>
            </Center>
          )}
        </ScrollArea>
      </Stack>
      {challenge?.id && (
        <GameChallengeModal
          userId={user?.userId ?? ''}
          gameId={numId}
          opened={detailOpened}
          withCloseButton={false}
          onClose={() => setDetailOpened(false)}
          gameEnded={dayjs(game?.end) < dayjs()}
          status={teamInfo?.rank?.solvedChallenges?.find((c) => c.id === challenge?.id)?.type}
          cateData={
            challengeCategoryLabelMap.get(
              (challenge?.category as ChallengeCategory) ?? ChallengeCategory.Misc
            )!
          }
          title={challenge?.title ?? ''}
          score={challenge?.score ?? 0}
          challengeId={challenge.id}
        />
      )}
    </>
  )
}

export default MobileChallengePanel
