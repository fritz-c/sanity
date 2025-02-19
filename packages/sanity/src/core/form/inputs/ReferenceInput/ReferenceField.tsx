import React, {useCallback, useMemo, useRef} from 'react'
import {Reference, ReferenceSchemaType} from '@sanity/types'
import {
  Box,
  Button,
  Card,
  CardTone,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Stack,
  Text,
} from '@sanity/ui'
import {
  CloseIcon,
  EllipsisVerticalIcon,
  LaunchIcon as OpenInNewTabIcon,
  SyncIcon as ReplaceIcon,
  TrashIcon,
} from '@sanity/icons'
import {ObjectFieldProps, RenderPreviewCallback} from '../../types'
import {FormField} from '../../components'
import {useScrollIntoViewOnFocusWithin} from '../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {set, unset} from '../../patch'
import {AlertStrip} from '../../components/AlertStrip'
import {ReferencePreviewCard} from './ReferenceItem'
import {useReferenceInput} from './useReferenceInput'
import {useReferenceInfo} from './useReferenceInfo'
import {PreviewReferenceValue} from './PreviewReferenceValue'

interface ReferenceFieldProps extends Omit<ObjectFieldProps, 'renderDefault'> {
  schemaType: ReferenceSchemaType
  renderPreview: RenderPreviewCallback
}

function getTone({
  readOnly,
  hasErrors,
  hasWarnings,
}: {
  readOnly: boolean | undefined
  hasErrors: boolean
  hasWarnings: boolean
}): CardTone {
  if (readOnly) {
    return 'transparent'
  }
  if (hasErrors) {
    return 'critical'
  }
  return hasWarnings ? 'caution' : 'default'
}
const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export function ReferenceField(props: ReferenceFieldProps) {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const {schemaType, path, open, inputId, children, inputProps} = props
  const {readOnly, focused, renderPreview, onChange} = props.inputProps

  const handleClear = useCallback(() => inputProps.onChange(unset()), [inputProps])
  const value: Reference | undefined = props.value as any

  const {EditReferenceLink, getReferenceInfo, selectedState, isCurrentDocumentLiveEdit} =
    useReferenceInput({
      path,
      schemaType,
      value,
    })

  // this is here to make sure the item is visible if it's being edited behind a modal
  useScrollIntoViewOnFocusWithin(elementRef, open)

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus && elementRef.current) {
      // Note: if editing an inline item, focus is handled by the item input itself and no ref is being set
      elementRef.current?.focus()
    }
  })

  const hasErrors = props.validation.some((v) => v.level === 'error')
  const hasWarnings = props.validation.some((v) => v.level === 'warning')

  const loadableReferenceInfo = useReferenceInfo(value?._ref, getReferenceInfo)

  const refTypeName = loadableReferenceInfo.result?.type || value?._strengthenOnPublish?.type

  const refType = refTypeName
    ? schemaType.to.find((toType) => toType.name === refTypeName)
    : undefined
  const pressed = selectedState === 'pressed'
  const selected = selectedState === 'selected'

  const hasRef = value?._ref
  const publishedReferenceExists = hasRef && loadableReferenceInfo.result?.preview?.published?._id

  const handleRemoveStrengthenOnPublish = useCallback(() => {
    onChange([
      schemaType.weak === true ? set(true, ['_weak']) : unset(['_weak']),
      unset(['_strengthenOnPublish']),
    ])
  }, [onChange, schemaType.weak])

  const handleFixStrengthMismatch = useCallback(() => {
    onChange(schemaType.weak === true ? set(true, ['_weak']) : unset(['_weak']))
  }, [onChange, schemaType])

  const weakIs = value?._weak ? 'weak' : 'strong'
  const weakShouldBe = schemaType.weak === true ? 'weak' : 'strong'

  // If the reference value is marked with _strengthenOnPublish,
  // we allow weak references if the reference points to a document that has a draft but not a published
  // In all other cases we should display a "weak mismatch" warning
  const weakWarningOverride =
    hasRef && !loadableReferenceInfo.isLoading && value?._strengthenOnPublish

  const showWeakRefMismatch =
    !loadableReferenceInfo.isLoading && hasRef && weakIs !== weakShouldBe && !weakWarningOverride

  const tone = getTone({readOnly, hasErrors, hasWarnings})
  const isEditing = !value?._ref || inputProps.focusPath[0] === '_ref'
  const preview =
    loadableReferenceInfo.result?.preview.draft || loadableReferenceInfo.result?.preview.published

  const footer = (
    <>
      {isCurrentDocumentLiveEdit && publishedReferenceExists && value._strengthenOnPublish && (
        <AlertStrip
          padding={1}
          title={schemaType.weak ? 'Finalize reference' : 'Convert to strong reference'}
          status="info"
          data-testid="alert-reference-published"
        >
          <Stack space={3}>
            <Text as="p" muted size={1}>
              <strong>{loadableReferenceInfo.result?.preview.published?.title as any}</strong> is
              published and this reference should now be{' '}
              {schemaType.weak ? <>finalized</> : <>converted to a strong reference</>}.
            </Text>
            <Button
              onClick={handleRemoveStrengthenOnPublish}
              text={<>Convert to strong reference</>}
              tone="positive"
            />
          </Stack>
        </AlertStrip>
      )}
      {showWeakRefMismatch && (
        <AlertStrip
          padding={1}
          title="Reference strength mismatch"
          status="warning"
          data-testid="alert-reference-strength-mismatch"
        >
          <Stack space={3}>
            <Text as="p" muted size={1}>
              This reference is <em>{weakIs}</em>, but according to the current schema it should be{' '}
              <em>{weakShouldBe}.</em>
            </Text>

            <Text as="p" muted size={1}>
              {schemaType.weak ? (
                <>
                  It will not be possible to delete the "{preview?.title}"-document without first
                  removing this reference.
                </>
              ) : (
                <>
                  This makes it possible to delete the "{preview?.title}"-document without first
                  deleting this reference, leaving this field referencing a nonexisting document.
                </>
              )}
            </Text>
            <Button
              onClick={handleFixStrengthMismatch}
              text={<>Convert to {weakShouldBe} reference</>}
              tone="caution"
            />
          </Stack>
        </AlertStrip>
      )}
      {loadableReferenceInfo.error && (
        <AlertStrip
          padding={1}
          title="Unable to load reference metadata"
          status="warning"
          data-testid="alert-reference-info-failed"
        >
          <Stack space={3}>
            <Text as="p" muted size={1}>
              Error: {loadableReferenceInfo.error.message}
            </Text>
            <Button onClick={loadableReferenceInfo.retry!} text={<>Retry</>} tone="primary" />
          </Stack>
        </AlertStrip>
      )}
    </>
  )

  const menu = useMemo(
    () =>
      readOnly ? null : (
        <Box marginLeft={1}>
          <MenuButton
            button={<Button paddingY={3} paddingX={2} mode="bleed" icon={EllipsisVerticalIcon} />}
            id={`${inputId}-menuButton`}
            menu={
              <Menu>
                {!readOnly && (
                  <>
                    <MenuItem text="Clear" tone="critical" icon={TrashIcon} onClick={handleClear} />
                    <MenuItem
                      text={value?._ref && isEditing ? 'Cancel replace' : 'Replace'}
                      icon={value?._ref && isEditing ? CloseIcon : ReplaceIcon}
                      onClick={
                        value?._ref && isEditing
                          ? () => inputProps.onPathFocus([])
                          : () => inputProps.onPathFocus(['_ref'])
                      }
                    />
                  </>
                )}

                {!readOnly && !isEditing && value._ref && <MenuDivider />}
                {!isEditing && value._ref && (
                  <MenuItem
                    as={EditReferenceLink}
                    data-as="a"
                    text="Open in new tab"
                    icon={OpenInNewTabIcon}
                  />
                )}
              </Menu>
            }
            popover={MENU_POPOVER_PROPS}
          />
        </Box>
      ),
    [readOnly, inputId, handleClear, value?._ref, isEditing, EditReferenceLink, inputProps]
  )
  return (
    <FormField
      level={props.level}
      title={props.title}
      description={props.description}
      validation={props.validation}
      __unstable_presence={props.presence}
    >
      {isEditing ? (
        <Box paddingY={2}>{children}</Box>
      ) : (
        <Card shadow={1} radius={1} padding={1} tone={tone}>
          <Stack space={1}>
            <Flex gap={1} align="center">
              <ReferencePreviewCard
                flex={1}
                forwardedAs={EditReferenceLink as any}
                tone="inherit"
                radius={2}
                data-as="a"
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                documentId={value?._ref}
                documentType={refType?.name}
                paddingX={2}
                paddingY={1}
                __unstable_focusRing
                style={{position: 'relative'}}
                selected={selected}
                pressed={pressed}
                data-selected={selected ? true : undefined}
                data-pressed={pressed ? true : undefined}
              >
                <PreviewReferenceValue
                  value={value}
                  referenceInfo={loadableReferenceInfo}
                  renderPreview={renderPreview}
                  type={schemaType}
                />
              </ReferencePreviewCard>
              <Box>{menu}</Box>
            </Flex>
            {footer}
          </Stack>
        </Card>
      )}
    </FormField>
  )
}
