import {
  Card,
  Center,
  Code,
  Group,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core'
import { mdiFlag } from '@mdi/js'
import { Icon } from '@mdi/react'
import cx from 'clsx'
import { FC } from 'react'
import { Trans } from 'react-i18next'
import { PartialIconProps, useChallengeCategoryLabelMap } from '@Utils/Shared'
import { ChallengeInfo, SubmissionType } from '@Api'
import classes from '@Styles/MobileChallengeCard.module.css'
import hoverClasses from '@Styles/HoverCard.module.css'

interface MobileChallengeCardProps {
  challenge: ChallengeInfo
  solved?: boolean
  onClick?: () => void
  iconMap: Map<SubmissionType, PartialIconProps | undefined>
  colorMap: Map<SubmissionType, string | undefined>
  teamId?: number
  hideWeekInTitle?: boolean
  solveMark?: string
}

const MobileChallengeCard: FC<MobileChallengeCardProps> = (props: MobileChallengeCardProps) => {
  const { challenge, solved, onClick } = props
  const challengeCategoryLabelMap = useChallengeCategoryLabelMap()
  const cateData = challengeCategoryLabelMap.get(challenge.category!)
  const theme = useMantineTheme()

  const darkenCard = solved || undefined
  const showMark = solved
  const markIcon = <Icon size={0.9} path={mdiFlag} />

  return (
    <Card
      onClick={onClick}
      radius="sm"
      className={cx(hoverClasses.root, classes.root)}
      data-solved={darkenCard}
    >
      <Stack gap="0.25rem" pos="relative" style={{ zIndex: 99 }}>
        <Group h="30px" wrap="nowrap" gap="xs">
          {cateData && (
            <Icon size={1} path={cateData.icon} color={theme.colors[cateData?.color][7]} />
          )}
          <Text fw="bold" truncate>
            {challenge.title}
          </Text>
        </Group>
        <Group wrap="nowrap" align="center" gap={2}>
          <Text ta="center" fw="bold" fz="sm" ff="monospace">
            {challenge.score}&nbsp;pts&nbsp;/
          </Text>
          <Title order={6} c="dimmed" ta="center">
            <Trans
              i18nKey={'challenge.content.solved'}
              values={{
                solved: challenge.solved,
              }}
            >
              _
              <Code fz="sm" fw="bold" bg="transparent">
                _
              </Code>
              _
            </Trans>
          </Title>
        </Group>
      </Stack>
      {showMark && (
        <Center className={classes.flag}>
          {markIcon}
        </Center>
      )}
    </Card>
  )
}

export default MobileChallengeCard
