import { Anchor, Button, Grid, PasswordInput, TextInput } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { showNotification, updateNotification } from '@mantine/notifications'
import { mdiCheck, mdiClose, mdiAccount, mdiLock } from '@mdi/js'
import { Icon } from '@mdi/react'
import { FC, useEffect, useState } from 'react'
import React, { ChangeEvent, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AccountView from '@Components/AccountView'
import Captcha, { useCaptchaRef } from '@Components/Captcha'
import { usePageTitle } from '@Utils/usePageTitle'
import { useUser } from '@Utils/useUser'
import api from '@Api'
import '../../styles/components/login.css'

const Login: FC = () => {
  const params = useSearchParams()[0]
  const navigate = useNavigate()

  const [pwd, setPwd] = useInputState('')
  const [uname, setUname] = useInputState('')
  const [disabled, setDisabled] = useState(false)
  const [needRedirect, setNeedRedirect] = useState(false)

  const { captchaRef, getToken } = useCaptchaRef()
  const { user, mutate } = useUser()

  const { t } = useTranslation()

  usePageTitle(t('account.title.login'))

  useEffect(() => {
    if (needRedirect && user) {
      setNeedRedirect(false)
      setTimeout(() => {
        navigate(params.get('from') ?? '/')
      }, 200)
    }
  }, [user, needRedirect])

  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (uname.length === 0 || pwd.length < 6) {
        showNotification({
          color: 'red',
          title: t('account.notification.login.invalid'),
          message: t('common.error.check_input'),
          icon: <Icon path={mdiClose} size={1} />,
        })
        setDisabled(false)
        return
      }

      const { valid, token } = await getToken()

      if (!valid) {
        showNotification({
          color: 'orange',
          title: t('account.notification.captcha.not_valid'),
          message: t('common.error.try_later'),
          loading: true,
        })
        return
      }

      setDisabled(true)

      showNotification({
        color: 'orange',
        id: 'login-status',
        title: t('account.notification.captcha.request_sent.title'),
        message: t('account.notification.captcha.request_sent.message'),
        loading: true,
        autoClose: false,
      })

      try {
        await api.account.accountLogIn({
          userName: uname,
          password: pwd,
          challenge: token,
        })

        updateNotification({
          id: 'login-status',
          color: 'teal',
          title: t('account.notification.login.success.title'),
          message: t('account.notification.login.success.message'),
          icon: <Icon path={mdiCheck} size={1} />,
          autoClose: true,
          loading: false,
        })
        setNeedRedirect(true)
        mutate()
      } catch (err: any) {
        updateNotification({
          id: 'login-status',
          color: 'red',
          title: t('common.error.encountered'),
          message: err.response.data.title,
          icon: <Icon path={mdiClose} size={1} />,
          autoClose: true,
          loading: false,
        })
      } finally {
        setDisabled(false)
      }
    }
  };

  const onLogin = async (event: React.FormEvent) => {
    // event.preventDefault()

    if (uname.length === 0 || pwd.length < 6) {
      showNotification({
        color: 'red',
        title: t('account.notification.login.invalid'),
        message: t('common.error.check_input'),
        icon: <Icon path={mdiClose} size={1} />,
      })
      setDisabled(false)
      return
    }

    const { valid, token } = await getToken()

    if (!valid) {
      showNotification({
        color: 'orange',
        title: t('account.notification.captcha.not_valid'),
        message: t('common.error.try_later'),
        loading: true,
      })
      return
    }

    setDisabled(true)

    showNotification({
      color: 'orange',
      id: 'login-status',
      title: t('account.notification.captcha.request_sent.title'),
      message: t('account.notification.captcha.request_sent.message'),
      loading: true,
      autoClose: false,
    })

    try {
      await api.account.accountLogIn({
        userName: uname,
        password: pwd,
        challenge: token,
      })

      updateNotification({
        id: 'login-status',
        color: 'teal',
        title: t('account.notification.login.success.title'),
        message: t('account.notification.login.success.message'),
        icon: <Icon path={mdiCheck} size={1} />,
        autoClose: true,
        loading: false,
      })
      setNeedRedirect(true)
      mutate()
    } catch (err: any) {
      updateNotification({
        id: 'login-status',
        color: 'red',
        title: t('common.error.encountered'),
        message: err.response.data.title,
        icon: <Icon path={mdiClose} size={1} />,
        autoClose: true,
        loading: false,
      })
    } finally {
      setDisabled(false)
    }
  }

  return (
    <AccountView onSubmit={onLogin}>
      <TextInput
        required
        // label={t('account.label.username_or_email')}
        placeholder="请输入账号信息"
        leftSection={<div className="userIcon"></div>}
        type="text"
        w="100%"
        classNames={{
          input: 'custom-input',
          wrapper: 'custom-wrapper',
          label: 'custom-label',
        }}
        style={{
          marginBottom: "25px",
        }}
        value={uname}
        disabled={disabled}
        onChange={(event) => setUname(event.currentTarget.value)}
      />
      <PasswordInput
        required
        // label={t('account.label.password')}
        leftSection={<div className="passIcon"></div>}
        id="your-password"
        placeholder="请输入密码"
        style={{
          marginBottom: "15px",
        }}
        w="100%"
        classNames={{
          input: 'custom-input',
          wrapper: 'custom-wrapper',
          label: 'custom-label',
        }}
        value={pwd}
        disabled={disabled}
        onChange={(event) => setPwd(event.currentTarget.value)}
        onKeyDown={handleKeyDown}  // 监听键盘事件
      />
      <Captcha action="login" ref={captchaRef} />
      <Anchor
        sx={(theme) => ({
          fontSize: theme.fontSizes.xs,
          alignSelf: 'end',
          color: '#0066ff'
        })}
        component={Link}
        to="/account/recovery"
      >
        {t('account.anchor.recovery')}
      </Anchor>
      <Grid grow w="100%">
        <Grid.Col span={2}>
          <Button fullWidth variant="outline" classNames={{ root: 'custom-button', inner: 'custom-button-inner' }} component={Link} to="/account/register">
            {t('account.button.register')}
          </Button>
        </Grid.Col>
        <Grid.Col span={2}>
          <Button fullWidth disabled={disabled} classNames={{ root: 'custom-button-d', inner: 'custom-button-inner-d' }} onClick={onLogin}>
            {t('account.button.login')}
          </Button>
        </Grid.Col>
      </Grid>
    </AccountView>
  )
}

export default Login
