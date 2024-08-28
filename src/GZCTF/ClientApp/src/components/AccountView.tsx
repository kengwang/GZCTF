import { Center, Stack } from '@mantine/core'
import { FC } from 'react'
import { PropsWithChildren } from 'react'
import { useNavigate } from 'react-router-dom'
import LogoHeader from '@Components/LogoHeader'
import '../styles/components/login.css'

interface AccountViewProps extends PropsWithChildren {
  onSubmit?: (event: React.FormEvent) => Promise<void>
}

const AccountView: FC<AccountViewProps> = ({ onSubmit, children }) => {
  const navigate = useNavigate()

  return (
    <Center h="100vh" className="background">
      <div className="title"></div>
      <Stack className="loginCentr" align="center" justify="center">
        {/* <LogoHeader onClick={() => navigate('/')} /> */}
        <div style={{height:'60px'}}>
          <div className="loginTitle">
            欢迎登录
          </div>
          <div className="loginCentent">
            2024“源鲁杯”高校网络安全技能大赛
          </div>
        </div>
        <form
          style={{
            width: '375px',
            minWidth: '375px',
            maxWidth: '375px',
            marginTop: '48px',
          }}
          onSubmit={onSubmit}
        >
          <Stack gap="xs" align="center" justify="center">
            {children}
          </Stack>
        </form>
      </Stack>
    </Center>
  )
}

export default AccountView
