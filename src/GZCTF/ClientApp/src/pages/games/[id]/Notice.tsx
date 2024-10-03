import { Stack } from '@mantine/core'
import { FC } from 'react'
import GameNoticePanel from '@Components/GameNoticePanel'
import WithGameTab from '@Components/WithGameTab'
import WithNavBar from '@Components/WithNavbar'

const Notice: FC = () => {
  return (
    <WithNavBar width="90%" minWidth={0}>
      <WithGameTab>
        <Stack pb="2rem">
          <GameNoticePanel panelHeight="calc(100dvh - 15.75rem)" />
        </Stack>
      </WithGameTab>
    </WithNavBar>
  )
}

export default Notice
