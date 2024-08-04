import {
  ActionIcon,
  alpha,
  Avatar,
  Box,
  Center,
  CloseButton,
  ComboboxItem,
  Group,
  Input,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core'
import { Icon } from '@mdi/react'
import cx from 'clsx'
import dayjs from 'dayjs'
import React, { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import ScoreboardItemModal from '@Components/ScoreboardItemModal'
import {
  BloodBonus,
  BloodsTypes,
  ChallengeTagItem,
  useChallengeTagLabelMap,
  SubmissionTypeIconMap,
  useBonusLabels,
  PartialIconProps,
} from '@Utils/Shared'
import { useGameScoreboard, generateCustomScoreboard } from '@Utils/useGame'
import { ChallengeInfo, ChallengeTag, ScoreboardItem, SubmissionType } from '@Api'
import classes from '@Styles/ScoreboardTable.module.css'
import tooltipClasses from '@Styles/Tooltip.module.css'
import { mdiMagnify } from '@mdi/js'

const Lefts = [0, 55, 110, 280, 350, 410]
const Widths = Array(5).fill(0)
Lefts.forEach((val, idx) => {
  Widths[idx - 1 || 0] = val - Lefts[idx - 1 || 0]
})

const TableHeader = (table: Record<string, ChallengeInfo[]>) => {
  const theme = useMantineTheme()
  const { colorScheme } = useMantineColorScheme()
  const { t } = useTranslation()
  const challengeTagLabelMap = useChallengeTagLabelMap()

  const hiddenCol = [...Array(5).keys()].map((i) => (
    <Table.Th
      key={i}
      className={classes.left}
      style={{
        left: Lefts[i],
        width: Widths[i],
        minWidth: Widths[i],
        maxWidth: Widths[i],
      }}
    >
      &nbsp;
    </Table.Th>
  ))

  return (
    <Table.Thead className={classes.thead}>
      {/* Challenge Tag */}
      <Table.Tr style={{ border: 'none' }}>
        {hiddenCol}
        {Object.keys(table).map((key) => {
          const tag = challengeTagLabelMap.get(key as ChallengeTag)!
          return (
            <Table.Th
              key={key}
              colSpan={table[key].length}
              h="3rem"
              style={{
                backgroundColor: alpha(
                  theme.colors[tag.color][colorScheme === 'dark' ? 8 : 6],
                  colorScheme === 'dark' ? 0.15 : 0.2
                ),
              }}
            >
              <Group gap={4} wrap="nowrap" justify="center" w="100%">
                <Icon
                  path={tag.icon}
                  size={1}
                  color={theme.colors[tag.color][colorScheme === 'dark' ? 8 : 6]}
                />
                <Text c={tag.color} className={classes.text} ff="text" fz="sm">
                  {key}
                </Text>
              </Group>
            </Table.Th>
          )
        })}
      </Table.Tr>
      {/* Challenge Name */}
      <Table.Tr>
        {hiddenCol}
        {Object.keys(table).map((key) =>
          table[key].map((item) => <Table.Th key={item.id}>{item.title}</Table.Th>)
        )}
      </Table.Tr>
      {/* Headers & Score */}
      <Table.Tr>
        {[
          t('game.label.score_table.rank_total'),
          t('game.label.score_table.rank_organization'),
          t('common.label.team'),
          t('game.label.score_table.solved_count'),
          t('game.label.score_table.score_total'),
        ].map((header, idx) => (
          <Table.Th
            key={idx}
            className={cx(classes.left, classes.header)}
            style={{ left: Lefts[idx] }}
          >
            {header}
          </Table.Th>
        ))}
        {Object.keys(table).map((key) =>
          table[key].map((item) => (
            <Table.Th key={item.id} className={classes.mono}>
              {item.score}
            </Table.Th>
          ))
        )}
      </Table.Tr>
    </Table.Thead>
  )
}

const TableRow: FC<{
  item: ScoreboardItem
  allRank: boolean
  tableRank: number
  onOpenDetail: () => void
  iconMap: Map<SubmissionType, PartialIconProps | undefined>
  challenges?: Record<string, ChallengeInfo[]>
}> = ({ item, challenges, onOpenDetail, iconMap, tableRank, allRank }) => {
  const theme = useMantineTheme()
  const challengeTagLabelMap = useChallengeTagLabelMap()
  const solved = item.challenges?.filter((c) => c.type !== SubmissionType.Unaccepted)

  return (
    <Table.Tr>
      <Table.Td className={cx(classes.mono, classes.left)} style={{ left: Lefts[0] }}>
        {item.rank}
      </Table.Td>
      <Table.Td className={cx(classes.mono, classes.left)} style={{ left: Lefts[1] }}>
        {allRank ? item.rank : (item.organizationRank ?? tableRank)}
      </Table.Td>
      <Table.Td className={classes.left} style={{ left: Lefts[2] }}>
        <Group justify="left" gap={5} wrap="nowrap" onClick={onOpenDetail}>
          <Avatar
            alt="avatar"
            src={item.avatar}
            radius="xl"
            size={30}
            color={theme.primaryColor}
            style={{
              '&:hover': {
                cursor: 'pointer',
              },
            }}
          >
            {item.name?.slice(0, 1) ?? 'T'}
          </Avatar>
          <Input
            variant="unstyled"
            value={item.name}
            readOnly
            size="sm"
            classNames={{ wrapper: classes.wapper, input: classes.input }}
          />
        </Group>
      </Table.Td>
      <Table.Td className={cx(classes.mono, classes.left)} style={{ left: Lefts[3] }}>
        {solved?.length}
      </Table.Td>
      <Table.Td className={cx(classes.mono, classes.left)} style={{ left: Lefts[4] }}>
        {solved?.reduce((acc, cur) => acc + (cur?.score ?? 0), 0)}
      </Table.Td>
      {challenges &&
        Object.keys(challenges).map((key) =>
          challenges[key].map((item) => {
            const chal = solved?.find((c) => c.id === item.id)
            const icon = iconMap.get(chal?.type ?? SubmissionType.Unaccepted)

            if (!icon) return <Table.Td key={item.id} className={classes.mono} />

            const tag = challengeTagLabelMap.get(item.tag as ChallengeTag)!

            return (
              <Table.Td key={item.id} className={classes.mono}>
                <Tooltip
                  classNames={tooltipClasses}
                  transitionProps={{ transition: 'pop' }}
                  label={
                    <Stack align="flex-start" gap={0} maw="20rem">
                      <Text lineClamp={3} fz="xs" className={classes.text}>
                        {item.title}
                      </Text>
                      <Text c={tag.color} fz="xs" className={classes.text}>
                        + {chal?.score} pts
                      </Text>
                      <Text c="dimmed" fz="xs" className={classes.text}>
                        # {dayjs(chal?.time).format('MM/DD HH:mm:ss')}
                      </Text>
                    </Stack>
                  }
                >
                  <Center>
                    <Icon {...icon} />
                  </Center>
                </Tooltip>
              </Table.Td>
            )
          })
        )}
    </Table.Tr>
  )
}

const ITEM_COUNT_PER_PAGE = 30

export interface ScoreboardProps {
  organization: string | null
  setOrganization: (org: string | null) => void
  titlePattern: string | null
  setTitlePattern: (pattern: string | null) => void
  category: ChallengeTag | null
  setCategory: (tag: ChallengeTag | null) => void
}

const ScoreboardTable: FC<ScoreboardProps> = ({
  organization, setOrganization,
  titlePattern, setTitlePattern,
  category, setCategory,
}) => {
  const { id } = useParams()
  const numId = parseInt(id ?? '-1')
  const { iconMap } = SubmissionTypeIconMap(1)
  const [activePage, setPage] = useState(1)
  const [bloodBonus, setBloodBonus] = useState(BloodBonus.default)
  const challengeTagLabelMap = useChallengeTagLabelMap()
  const [searchTextBuffer, setSearchTextBuffer] = useState<string | null>('')
  const [searchCloseButtonVisible, setSearchCloseButtonVisible] = useState(false)
  const [filterTips, setFilterTips] = useState('')

  const [updatingBarrier, setUpdatingBarrier] = useState(true)

  const { scoreboard } = useGameScoreboard(numId)
  const [filteredItems, setFilteredItems] = useState<ScoreboardItem[] | null>(null)
  const [filteredChallenges, setFilteredChallenges] = useState<Record<string, ChallengeInfo[]> | null>(null)

  const base = (activePage - 1) * ITEM_COUNT_PER_PAGE
  const currentItems = filteredItems?.slice(base, base + ITEM_COUNT_PER_PAGE)

  const [currentItem, setCurrentItem] = useState<ScoreboardItem | null>(null)
  const [itemDetailOpened, setItemDetailOpened] = useState(false)

  const { t } = useTranslation()

  useEffect(() => {
    if (scoreboard) {
      setBloodBonus(new BloodBonus(scoreboard.bloodBonus))
    }

    setUpdatingBarrier(false)
    try {
      const customScoreboard = generateCustomScoreboard(
        scoreboard,
        organization ?? 'all',
        titlePattern?.trim() ?? '',
        category
      )
      setFilteredItems(customScoreboard.items)
      setFilteredChallenges(customScoreboard.challenges)
      setFilterTips(
        (titlePattern?.trim() ?? '') === '' && category === null
          ? ''
          : Object.keys(customScoreboard.challenges ?? {}).length
            ? 'game.content.custom_scoreboard.enabled'
            : 'game.content.custom_scoreboard.no_result'
      )
    } catch (error) {
      setFilterTips('game.content.custom_scoreboard.regex_error')
    }
    setUpdatingBarrier(true)
  }, [scoreboard, organization, titlePattern, category])

  const bloodData = useBonusLabels(bloodBonus)

  return (
    <Paper shadow="md" p="md">
      <Stack gap="xs">
        <Group style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }} >
          {scoreboard?.timeLines && Object.keys(scoreboard.timeLines).length > 1 && (
            <Select
              defaultValue="all"
              data={[
                { value: 'all', label: t('game.label.score_table.rank_total') },
                ...Object.keys(scoreboard.timeLines)
                  .filter((k) => k !== 'all')
                  .map((o) => ({
                    value: o,
                    label: o === 'all' ? t('game.label.score_table.rank_total') : o,
                  })),
              ]}
              value={organization}
              searchable
              onChange={(org) => {
                setOrganization(org)
                setPage(1)
              }}
              styles={{
                root: {
                  width: "24%",
                },
              }}
            />
          )}
          {scoreboard?.challenges && Object.keys(scoreboard.challenges).length > 0 && (
            <>
              <TextInput
                placeholder={t('game.placeholder.scoreboard_search')}
                leftSection={
                  <ActionIcon variant="transparent" color="dimmed" onClick={() => {
                    const searchText = searchTextBuffer?.trim() ?? ''
                    setTitlePattern(searchText)
                    setSearchTextBuffer(searchText)
                    setSearchCloseButtonVisible(searchText.length > 0)
                    setPage(1)
                  }}>
                    <Icon path={mdiMagnify} size={0.8} />
                  </ActionIcon>
                }
                rightSection={searchCloseButtonVisible &&
                  <CloseButton color="dimmed" size={'sm'} onClick={() => {
                    setSearchTextBuffer('')
                    setSearchCloseButtonVisible(false)
                    setTitlePattern('')
                    setPage(1)
                  }} />}
                value={searchTextBuffer ?? ''}
                onChange={(e) => {
                  setSearchTextBuffer(e.currentTarget.value)
                  setSearchCloseButtonVisible(e.currentTarget.value.length > 0)
                }}
                styles={{
                  root: {
                    width: "36%",
                  },
                }}
              />
              <Select
                placeholder={t('game.label.score_table.tag_all')}
                clearable
                searchable
                value={category}
                nothingFoundMessage={t('game.label.score_table.tag_empty')}
                onChange={(value) => {
                  setCategory(value as ChallengeTag | null)
                  setPage(1)
                }}
                renderOption={ChallengeTagItem}
                data={Object.entries(ChallengeTag).filter((tag) =>
                  (scoreboard?.challenges ?? {})[tag[1]]?.length ?? 0 > 0
                ).map((tag) => {
                  const data = challengeTagLabelMap.get(tag[1])
                  return { value: tag[1], label: data?.name, ...data } as ComboboxItem
                })}
                styles={{
                  root: {
                    width: "24%",
                  },
                }}
              />
            </>
          )}
        </Group>
        <Text size="md" c="dimmed" style={{ textAlign: 'center' }}>
          {t(filterTips)}
        </Text>
        {updatingBarrier && Object.keys(filteredChallenges ?? {}).length > 0 && <>
          <Box pos="relative">
            <Table.ScrollContainer
              minWidth="100%"
              styles={{
                scrollContainer: {
                  // Hide scrollbar (type = "never" for ScrollArea)
                  '--scrollarea-scrollbar-size': '0pt',
                },
              }}
            >
              <Table className={classes.table}>
                <TableHeader {...filteredChallenges} />
                <Table.Tbody>
                  {scoreboard &&
                    currentItems?.map((item, idx) => (
                      <TableRow
                        key={base + idx}
                        allRank={organization === 'all'}
                        tableRank={base + idx + 1}
                        item={item}
                        onOpenDetail={() => {
                          setCurrentItem(item)
                          setItemDetailOpened(true)
                        }}
                        challenges={filteredChallenges ?? {}}
                        iconMap={iconMap}
                      />
                    ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            <Box className={classes.legend}>
              <Stack gap="xs">
                <Tooltip.Group>
                  <Group gap="lg">
                    {BloodsTypes.map((type, idx) => (
                      <Tooltip
                        key={idx}
                        label={bloodData.get(type)?.name}
                        transitionProps={{ transition: 'pop' }}
                      >
                        <Group justify="left" gap={2}>
                          <Icon {...iconMap.get(type)!} />
                          <Text>{bloodData.get(type)?.descr}</Text>
                        </Group>
                      </Tooltip>
                    ))}
                  </Group>
                </Tooltip.Group>
                <Text size="sm" c="dimmed">
                  {t('game.content.scoreboard_note')}
                </Text>
              </Stack>
            </Box>
          </Box>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {t('game.content.scoreboard_tip')}
            </Text>
            <Pagination
              value={activePage}
              onChange={setPage}
              total={Math.ceil((filteredItems?.length ?? 1) / ITEM_COUNT_PER_PAGE)}
              boundaries={2}
            />
          </Group>
        </>}  
      </Stack>
      {updatingBarrier && Object.keys(filteredChallenges ?? {}).length > 0 &&
        <ScoreboardItemModal
          challenges={scoreboard?.challenges}
          bloodBonusMap={bloodData}
          opened={itemDetailOpened}
          withCloseButton={false}
          size="45rem"
          onClose={() => setItemDetailOpened(false)}
          item={currentItem}
        />
      }
    </Paper>
  )
}

export default ScoreboardTable
