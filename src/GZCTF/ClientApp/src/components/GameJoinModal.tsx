import { Button, Modal, ModalProps, Select, Stack, TextInput } from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { mdiClose } from '@mdi/js'
import { Icon } from '@mdi/react'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useGame } from '@Utils/useGame'
import { useTeams } from '@Utils/useUser'
import { GameJoinModel } from '@Api'
import api, { PostInfoModel, ParticipationStatus } from '@Api'

interface GameJoinModalProps extends ModalProps {
  onSubmitJoin: (info: GameJoinModel) => Promise<void>
}

const GameJoinModal: FC<GameJoinModalProps> = (props) => {
  const { data: allGames } = api.game.useGameGamesAll({
    refreshInterval: 5 * 60 * 1000,
  })

  allGames?.sort((a, b) => new Date(a.end!).getTime() - new Date(b.end!).getTime())


  const now = new Date()
  const recentGames = [
    ...(allGames?.filter((g) => now < new Date(g.end ?? '')) ?? []),
    ...(allGames?.filter((g) => now >= new Date(g.end ?? '')).reverse() ?? []),
  ].slice(0, 3)

  const { id } = useParams()
  let ids = null
  if (recentGames.length != 0) {
    ids = recentGames[0].id
  }
  let numId = null
  if(id === undefined){
    numId = ids
  }else{
    numId = parseInt(id ?? '-1')
  }
  const { onSubmitJoin, ...modalProps } = props
  const { teams } = useTeams()
  const { game } = useGame(numId)

  const [inviteCode, setInviteCode] = useState('')
  const [organization, setOrganization] = useState('')
  const [organizationVerifyCode, setOrganizationVerifyCode] = useState('')
  const [team, setTeam] = useState('')
  const [disabled, setDisabled] = useState(false)

  const { t } = useTranslation()

  useEffect(() => {
    if (teams && teams.length === 1) {
      setTeam(teams[0].id!.toString())
    }
  }, [teams])

  const onJoinGame = () => {
    setDisabled(true)

    if (!team) {
      showNotification({
        color: 'orange',
        message: t('game.notification.no_team'),
        icon: <Icon path={mdiClose} size={1} />,
      })
      setDisabled(false)
      return
    }

    if (game?.inviteCodeRequired && !inviteCode) {
      showNotification({
        color: 'orange',
        message: t('game.notification.no_invite_code'),
        icon: <Icon path={mdiClose} size={1} />,
      })
      setDisabled(false)
      return
    }

    if (game?.organizations && Object.keys(game.organizations).length > 0 && !organization) {
      showNotification({
        color: 'orange',
        message: t('game.notification.no_organization'),
        icon: <Icon path={mdiClose} size={1} />,
      })
      setDisabled(false)
      return
    }

    onSubmitJoin({
      teamId: parseInt(team),
      inviteCode: game?.inviteCodeRequired ? inviteCode : undefined,
      organization: game?.organizations && Object.keys(game.organizations).length > 0 ? organization : undefined,
      organizationVerifyCode: game?.organizationVerifyCodeRequired ? organizationVerifyCode : undefined,
    }).finally(() => {
      setInviteCode('')
      setOrganization('')
      setOrganizationVerifyCode('')
      setDisabled(false)
      props.onClose()
    })
  }

  return (
    <Modal {...modalProps}>
      <Stack>
        <Select
          required
          label={t('game.content.join.team.label')}
          description={t('game.content.join.team.description')}
          data={teams?.map((t) => ({ label: t.name!, value: t.id!.toString() })) ?? []}
          disabled={disabled}
          value={team}
          onChange={(e) => setTeam(e ?? '')}
        />
        {game?.inviteCodeRequired && (
          <TextInput
            required
            label={t('game.content.join.invite_code.label')}
            description={t('game.content.join.invite_code.description')}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            disabled={disabled}
          />
        )}
        {game?.organizations && game.organizations && Object.keys(game.organizations).length > 0 && (
          <Select
            required
            searchable
            label={t('game.content.join.organization.label')}
            description={t('game.content.join.organization.description')}
            data={
              Object.keys(game.organizations)
            }
            disabled={disabled}
            value={organization}
            onChange={(e) => setOrganization(e ?? '')}
          />
        )}
        {game?.organizationVerifyCodeRequired && (
          <TextInput
            label={t('game.content.join.organization_verify_code.label')}
            description={t('game.content.join.organization_verify_code.description')}
            value={organizationVerifyCode}
            onChange={(e) => setOrganizationVerifyCode(e.target.value.trim())}
            disabled={disabled}
          />
        )}
        <Button disabled={disabled} onClick={onJoinGame}>
          {t('game.button.join')}
        </Button>
      </Stack>
    </Modal>
  )
}

export default GameJoinModal
