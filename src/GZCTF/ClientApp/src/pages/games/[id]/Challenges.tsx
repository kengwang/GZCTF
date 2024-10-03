import { Group, Stack } from '@mantine/core'
import { FC } from 'react'
import ChallengePanel from '@Components/ChallengePanel'
import GameNoticePanel from '@Components/GameNoticePanel'
import TeamRank from '@Components/TeamRank'
import WithGameTab from '@Components/WithGameTab'
import WithNavBar from '@Components/WithNavbar'
import WithRole from '@Components/WithRole'
import { Role } from '@Api'
import { useIsMobile } from '@Utils/ThemeOverride'
import MobileChallengePanel from '@Components/MobileChallengePanel'

const Challenges: FC = () => {
  const isMobile = useIsMobile(1080)
  const isVertical = useIsMobile()

  return (
    <WithNavBar width="90%" minWidth={0}>
      <WithRole requiredRole={Role.User}>
        <WithGameTab>
          {isMobile ? (
            <Group gap="sm" justify="space-between" align="flex-start" wrap="nowrap">
              {isVertical ? <MobileChallengePanel /> : <ChallengePanel />}
            </Group>
          ) : (
            <Group gap="sm" justify="space-between" align="flex-start" wrap="nowrap">
              <ChallengePanel />
              {!isMobile && <Stack gap="sm" miw="22rem" maw="22rem">
                <TeamRank />
                <GameNoticePanel />
              </Stack>}
            </Group>
          )}
        </WithGameTab>
      </WithRole>
    </WithNavBar>
  )
}

export default Challenges
