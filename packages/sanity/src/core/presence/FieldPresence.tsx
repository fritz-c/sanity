import React, {memo, useContext, useId} from 'react'
import {sortBy, uniqBy} from 'lodash'
import {AvatarCounter, AvatarPosition} from '@sanity/ui'
import {UserAvatar} from '../components/UserAvatar'
import {
  AVATAR_DISTANCE,
  AVATAR_SIZE,
  DEFAULT_MAX_AVATARS_FIELDS,
  DISABLE_OVERLAY,
} from './constants'
import {splitRight} from './utils'
import {FlexWrapper, InnerBox} from './FieldPresence.styled'
import {FormFieldPresenceContext} from './context'
import {PresenceTooltip} from './PresenceTooltip'
import {useReporter} from './overlay/tracker'
import {FormNodePresence} from './types'

/** @internal */
export interface FieldPresenceInnerProps {
  maxAvatars?: number
  presence: FormNodePresence[]
  stack?: boolean
  position?: AvatarPosition
  animateArrowFrom?: AvatarPosition
}

function calcAvatarStackWidth(len: number) {
  return -AVATAR_DISTANCE + (AVATAR_SIZE + AVATAR_DISTANCE) * len
}

/** @internal */
export const FieldPresenceInner = memo(function FieldPresenceInner({
  presence,
  position = 'inside',
  animateArrowFrom = 'inside',
  maxAvatars = DEFAULT_MAX_AVATARS_FIELDS,
  stack = true,
}: FieldPresenceInnerProps) {
  const uniquePresence = uniqBy(presence || [], (item) => item.user.id)
  const sorted = sortBy(uniquePresence, (_presence) => _presence.lastActiveAt)
  const [hidden, visible] = stack ? splitRight(sorted, maxAvatars) : [[], sorted]

  const avatars = [
    ...visible.reverse().map((_visible) => ({
      key: _visible.user.id,
      element: (
        <UserAvatar
          animateArrowFrom={animateArrowFrom}
          position={position}
          status="online"
          user={_visible.user}
        />
      ),
    })),
    hidden.length >= 2
      ? {
          key: 'counter',
          element: <AvatarCounter count={hidden.length} />,
        }
      : null,
  ].filter(Boolean)

  const maxWidth = calcAvatarStackWidth(maxAvatars)
  const currWidth = Math.min(calcAvatarStackWidth(uniquePresence.length), maxWidth)

  return (
    <FlexWrapper justify="flex-end" style={{width: maxWidth}}>
      <div />

      <PresenceTooltip items={uniquePresence}>
        <InnerBox direction="row-reverse" style={{width: currWidth}}>
          {avatars.map(
            (av, i) =>
              av && (
                <div
                  key={av.key}
                  style={{
                    position: 'absolute',
                    transform: `translate3d(${-i * (AVATAR_SIZE + AVATAR_DISTANCE)}px, 0px, 0px)`,
                    transitionProperty: 'transform',
                    transitionDuration: '200ms',
                    transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)',
                    zIndex: 100 - i,
                  }}
                >
                  {av.element}
                </div>
              )
          )}
        </InnerBox>
      </PresenceTooltip>
    </FlexWrapper>
  )
})

/** @internal */
export interface FieldPresenceProps {
  presence: FormNodePresence[]
  maxAvatars: number
}

/** @internal */
export function FieldPresenceWithOverlay(props: FieldPresenceProps) {
  const contextPresence = useContext(FormFieldPresenceContext)
  const {presence = contextPresence, maxAvatars = DEFAULT_MAX_AVATARS_FIELDS} = props
  const ref = React.useRef(null)

  useReporter(useId(), () => ({presence, element: ref.current!, maxAvatars: maxAvatars}))

  const minWidth = -AVATAR_DISTANCE + (AVATAR_SIZE + AVATAR_DISTANCE) * props.maxAvatars

  return (
    <FlexWrapper
      justify="flex-end"
      ref={ref}
      style={{minWidth: minWidth, minHeight: AVATAR_SIZE}}
    />
  )
}

/** @internal */
export function FieldPresenceWithoutOverlay(props: FieldPresenceProps) {
  const contextPresence = useContext(FormFieldPresenceContext)
  const {presence = contextPresence, maxAvatars = DEFAULT_MAX_AVATARS_FIELDS} = props

  if (!presence.length) {
    return null
  }

  return <FieldPresenceInner presence={presence} maxAvatars={maxAvatars} />
}

/** @internal */
export const FieldPresence = DISABLE_OVERLAY
  ? FieldPresenceWithoutOverlay
  : FieldPresenceWithOverlay
