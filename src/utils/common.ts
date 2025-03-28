type NumberEnumType = {
  [key: string]: string | number
}

export const numberEnumToArray = (numberEnum: NumberEnumType) => {
  return Object.values(numberEnum).filter((value) => typeof value === 'number') as number[]
}
