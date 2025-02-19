import {ArrowLeftIcon, ControlsIcon, SearchIcon, SpinnerIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Theme} from '@sanity/ui'
import React, {useCallback, useEffect, useRef} from 'react'
import styled, {keyframes} from 'styled-components'
import {useSearchState} from '../contexts/search/useSearchState'
import {useCommandList} from './commandList/useCommandList'
import {CustomTextInput} from './common/CustomTextInput'

interface SearchHeaderProps {
  onClose: () => void
}

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const AnimatedSpinnerIcon = styled(SpinnerIcon)`
  animation: ${rotate} 500ms linear infinite;
`

const FilterBox = styled(Box)`
  position: relative;
`

const SearchHeaderCard = styled(Card)`
  flex-shrink: 0;
`

const NotificationBadge = styled.div`
  background: ${({theme}: {theme: Theme}) => theme.sanity.color.selectable?.primary.enabled.fg};
  border-radius: 100%;
  height: 6px;
  position: absolute;
  right: 2px;
  top: 2px;
  width: 6px;
`

export function SearchHeader({onClose}: SearchHeaderProps) {
  const isMountedRef = useRef(false)

  const {
    dispatch,
    state: {
      filters,
      filtersVisible,
      fullscreen,
      result: {loading},
      terms: {types, query},
    },
  } = useSearchState()

  const {setHeaderInputElement} = useCommandList()

  const handleFiltersToggle = useCallback(
    () => dispatch({type: 'FILTERS_VISIBLE_SET', visible: !filtersVisible}),
    [dispatch, filtersVisible]
  )
  const handleQueryChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) =>
      dispatch({type: 'TERMS_QUERY_SET', query: e.currentTarget.value}),
    [dispatch]
  )
  const handleQueryClear = useCallback(() => {
    dispatch({type: 'TERMS_QUERY_SET', query: ''})
  }, [dispatch])

  /**
   * Always show filters on non-fullscreen mode
   */
  useEffect(() => {
    if (!fullscreen) {
      dispatch({type: 'FILTERS_VISIBLE_SET', visible: true})
    }
  }, [dispatch, fullscreen])

  useEffect(() => {
    isMountedRef.current = true
  }, [])

  const notificationBadgeVisible = filters.length > 0 || types.length > 0

  return (
    <SearchHeaderCard>
      <Flex align="center" flex={1} gap={fullscreen ? 2 : 1} padding={fullscreen ? 2 : 1}>
        {/* (Fullscreen) Close button */}
        {fullscreen && (
          <Card>
            <Button aria-label="Close search" icon={ArrowLeftIcon} mode="bleed" onClick={onClose} />
          </Card>
        )}

        {/* Search field */}
        <Box flex={1}>
          <CustomTextInput
            autoComplete="off"
            background={fullscreen}
            border={false}
            clearButton={!!query}
            fontSize={2}
            icon={loading ? AnimatedSpinnerIcon : SearchIcon}
            onChange={handleQueryChange}
            onClear={handleQueryClear}
            placeholder="Search"
            ref={setHeaderInputElement}
            smallClearButton={fullscreen}
            spellCheck={false}
            value={query}
          />
        </Box>

        {/* Filter toggle */}
        {fullscreen && (
          <FilterBox>
            <Button
              aria-expanded={filtersVisible}
              aria-label="Toggle filters"
              height="fill"
              icon={ControlsIcon}
              mode="bleed"
              onClick={handleFiltersToggle}
              padding={3}
              selected={filtersVisible}
              tone="default"
            />
            {notificationBadgeVisible && <NotificationBadge />}
          </FilterBox>
        )}
      </Flex>
    </SearchHeaderCard>
  )
}
