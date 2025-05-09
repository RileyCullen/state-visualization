export type StateCartogramData = [CartogramStateId, number];

/**
 * A mapping from state to FIPS code as defined here.
 * https://en.wikipedia.org/wiki/Federal_Information_Processing_Standard_state_code
 */
export enum CartogramStateId {
    Alabama = '01',
    Alaska = '02',
    Arizona = '04',
    Arkansas = '05',
    California = '06',
    Colorado = '08',
    Connecticut = '09',
    Delaware = '10',
    Florida = '12',
    Georgia = '13',
    Hawaii = '15',
    Idaho = '16',
    Illinois = '17',
    Indiana = '18',
    Iowa = '19',
    Kansas = '20',
    Kentucky = '21',
    Louisiana = '22',
    Maine = '23',
    Maryland = '24',
    Massachusetts = '25',
    Michigan = '26',
    Minnesota = '27',
    Mississippi = '28',
    Missouri = '29',
    Montana = '30',
    Nebraska = '31',
    Nevada = '32',
    New_Hampshire = '33',
    New_Jersey = '34',
    New_Mexico = '35',
    New_York = '36',
    North_Carolina = '37',
    North_Dakota = '38',
    Ohio = '39',
    Oklahoma = '40',
    Oregon = '41',
    Pennsylvania = '42',
    Rhode_Island = '44',
    South_Carolina = '45',
    South_Dakota = '46',
    Tennessee = '47',
    Texas = '48',
    Utah = '49',
    Vermont = '50',
    Virginia = '51',
    Washington = '53',
    West_Virginia = '54',
    Wisconsin = '55',
    Wyoming = '56'
}

// Type for the reverse mapping (code to state name)
export type StateCodeToName = {
    [code: string]: keyof typeof CartogramStateId
}

// Create the reverse mapping
export const stateCodeToName: StateCodeToName = Object.entries(CartogramStateId).reduce(
    (acc, [stateName, stateCode]) => {
        acc[stateCode] = stateName as keyof typeof CartogramStateId
        return acc
    },
    {} as StateCodeToName,
)

export const MockDataset: StateCartogramData[] = [
    [CartogramStateId.Alabama, 7],
    [CartogramStateId.Arizona, 112],
    [CartogramStateId.Arkansas, 5],
    [CartogramStateId.California, 98],
    [CartogramStateId.Colorado, 14],
    [CartogramStateId.Delaware, 4],
    [CartogramStateId.Florida, 73],
    [CartogramStateId.Georgia, 4],
    [CartogramStateId.Illinois, 3],
    [CartogramStateId.Indiana, 7],
    [CartogramStateId.Kansas, 21],
    [CartogramStateId.Kentucky, 11],
    [CartogramStateId.Louisiana, 8],
    [CartogramStateId.Maryland, 4],
    [CartogramStateId.Mississippi, 5],
    [CartogramStateId.Missouri, 22],
    [CartogramStateId.Nevada, 2],
    [CartogramStateId.New_Mexico, 58],
    [CartogramStateId.Ohio, 4],
    [CartogramStateId.Oklahoma, 14],
    [CartogramStateId.Pennsylvania, 1],
    [CartogramStateId.South_Carolina, 1],
    [CartogramStateId.Tennessee, 19],
    [CartogramStateId.Texas, 6633],
    [CartogramStateId.Utah, 2],
    [CartogramStateId.Virginia, 28],
    [CartogramStateId.West_Virginia, 11],
    [CartogramStateId.North_Carolina, 5]
];

