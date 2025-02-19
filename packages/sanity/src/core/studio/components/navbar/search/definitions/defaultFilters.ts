import {
  BlockContentIcon,
  CalendarIcon,
  CheckmarkCircleIcon,
  DocumentIcon,
  ImageIcon,
  LinkIcon,
  NumberIcon,
  SelectIcon,
  StringIcon,
  UlistIcon,
} from '@sanity/icons'
import {defineSearchFilter, SearchFilterDefinition} from './filters'
import {SearchOperatorType} from './operators/defaultOperators'

export const filterDefinitions: SearchFilterDefinition[] = [
  // 'Pinned' filters
  defineSearchFilter<SearchOperatorType>({
    fieldPath: '_updatedAt',
    icon: CalendarIcon,
    operators: [
      {name: 'dateTimeLast', type: 'item'},
      {type: 'divider'},
      {name: 'dateTimeAfter', type: 'item'},
      {name: 'dateTimeBefore', type: 'item'},
      {type: 'divider'},
      {name: 'dateTimeEqual', type: 'item'},
      {name: 'dateTimeNotEqual', type: 'item'},
    ],
    title: 'Updated at',
    name: 'updatedAt',
    type: 'pinned',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldPath: '_createdAt',
    icon: CalendarIcon,
    operators: [
      {name: 'dateTimeLast', type: 'item'},
      {type: 'divider'},
      {name: 'dateTimeAfter', type: 'item'},
      {name: 'dateTimeBefore', type: 'item'},
      {type: 'divider'},
      {name: 'dateTimeEqual', type: 'item'},
      {name: 'dateTimeNotEqual', type: 'item'},
    ],
    title: 'Created at',
    name: 'createdAt',
    type: 'pinned',
  }),
  defineSearchFilter<SearchOperatorType>({
    icon: LinkIcon,
    operators: [
      {name: 'referencesDocument', type: 'item'},
      {name: 'referencesAssetImage', type: 'item'},
      {name: 'referencesAssetFile', type: 'item'},
    ],
    title: 'Contains document, image or file',
    name: 'references',
    type: 'pinned',
  }),
  // 'Field' filters
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'array',
    icon: UlistIcon,
    name: 'array',
    operators: [
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
      {type: 'divider'},
      {name: 'arrayCountEqual', type: 'item'},
      {name: 'arrayCountNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'arrayCountGt', type: 'item'},
      {name: 'arrayCountGte', type: 'item'},
      {name: 'arrayCountLt', type: 'item'},
      {name: 'arrayCountLte', type: 'item'},
      {type: 'divider'},
      {name: 'arrayCountRange', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'array',
    icon: UlistIcon,
    name: 'arrayList',
    operators: [
      {name: 'arrayListIncludes', type: 'item'},
      {name: 'arrayListNotIncludes', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
      {type: 'divider'},
      {name: 'arrayCountEqual', type: 'item'},
      {name: 'arrayCountNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'arrayCountGt', type: 'item'},
      {name: 'arrayCountGte', type: 'item'},
      {name: 'arrayCountLt', type: 'item'},
      {name: 'arrayCountLte', type: 'item'},
      {type: 'divider'},
      {name: 'arrayCountRange', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'array',
    icon: UlistIcon,
    name: 'arrayReferences',
    operators: [
      {name: 'arrayReferenceIncludes', type: 'item'},
      {name: 'arrayReferenceNotIncludes', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
      {type: 'divider'},
      {name: 'arrayCountEqual', type: 'item'},
      {name: 'arrayCountNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'arrayCountGt', type: 'item'},
      {name: 'arrayCountGte', type: 'item'},
      {name: 'arrayCountLt', type: 'item'},
      {name: 'arrayCountLte', type: 'item'},
      {type: 'divider'},
      {name: 'arrayCountRange', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'boolean',
    icon: CheckmarkCircleIcon,
    name: 'boolean',
    operators: [
      {name: 'booleanEqual', type: 'item'},
      {type: 'divider'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'date',
    icon: CalendarIcon,
    name: 'date',
    operators: [
      {name: 'dateLast', type: 'item'},
      {type: 'divider'},
      {name: 'dateAfter', type: 'item'},
      {name: 'dateBefore', type: 'item'},
      {type: 'divider'},
      {name: 'dateEqual', type: 'item'},
      {name: 'dateNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'datetime',
    icon: CalendarIcon,
    name: 'datetime',
    operators: [
      {name: 'dateTimeLast', type: 'item'},
      {type: 'divider'},
      {name: 'dateTimeAfter', type: 'item'},
      {name: 'dateTimeBefore', type: 'item'},
      {type: 'divider'},
      {name: 'dateTimeEqual', type: 'item'},
      {name: 'dateTimeNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'email',
    icon: StringIcon,
    name: 'email',
    operators: [
      {name: 'stringMatches', type: 'item'},
      {name: 'stringNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'stringEqual', type: 'item'},
      {name: 'stringNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'file',
    icon: DocumentIcon,
    name: 'file',
    operators: [
      {name: 'assetFileEqual', type: 'item'},
      {name: 'assetFileNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'image',
    icon: ImageIcon,
    name: 'image',
    operators: [
      {name: 'assetImageEqual', type: 'item'},
      {name: 'assetImageNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'number',
    icon: NumberIcon,
    name: 'number',
    operators: [
      {name: 'numberEqual', type: 'item'},
      {name: 'numberNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'numberGt', type: 'item'},
      {name: 'numberGte', type: 'item'},
      {name: 'numberLt', type: 'item'},
      {name: 'numberLte', type: 'item'},
      {type: 'divider'},
      {name: 'numberRange', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'array',
    icon: BlockContentIcon,
    name: 'portableText',
    operators: [
      {name: 'portableTextMatches', type: 'item'},
      {name: 'portableTextNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'portableTextEqual', type: 'item'},
      {name: 'portableTextNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'reference',
    icon: LinkIcon,
    name: 'reference',
    operators: [
      {name: 'referenceEqual', type: 'item'},
      {name: 'referenceNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'slug',
    icon: StringIcon,
    name: 'slug',
    operators: [
      {name: 'slugMatches', type: 'item'},
      {name: 'slugNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'slugEqual', type: 'item'},
      {name: 'slugNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'string',
    icon: StringIcon,
    name: 'string',
    operators: [
      {name: 'stringMatches', type: 'item'},
      {name: 'stringNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'stringEqual', type: 'item'},
      {name: 'stringNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'string',
    icon: SelectIcon,
    name: 'stringList',
    operators: [
      {name: 'stringListEqual', type: 'item'},
      {name: 'stringListNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'stringMatches', type: 'item'},
      {name: 'stringNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'text',
    icon: StringIcon,
    name: 'text',
    operators: [
      {name: 'stringMatches', type: 'item'},
      {name: 'stringNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'stringEqual', type: 'item'},
      {name: 'stringNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
  defineSearchFilter<SearchOperatorType>({
    fieldType: 'url',
    icon: StringIcon,
    name: 'url',
    operators: [
      {name: 'stringMatches', type: 'item'},
      {name: 'stringNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'stringEqual', type: 'item'},
      {name: 'stringNotEqual', type: 'item'},
      {type: 'divider'},
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    type: 'field',
  }),
]
