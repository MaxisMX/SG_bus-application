/**
 * TypeScript models for the LTA DataMall APIs.
 *
 * Field names and shapes are taken directly from the official sample
 * payloads (see __tests__/fixtures). Note that LTA returns several
 * numeric values as strings (Latitude, Longitude, VisitNumber) and uses
 * empty strings rather than null for missing data.
 */

/** Crowding level reported by the bus. */
export type BusLoad =
  | 'SEA' // Seats Available
  | 'SDA' // Standing Available
  | 'LSD' // Limited Standing
  | ''; // Not reported

/** Physical bus type. */
export type BusType =
  | 'SD' // Single Deck
  | 'DD' // Double Deck
  | 'BD' // Bendy
  | '';

/** 'WAB' means wheelchair accessible. */
export type BusFeature = 'WAB' | '';

/** Service classification from the Bus Services API. */
export type BusCategory =
  | 'EXPRESS'
  | 'FEEDER'
  | 'INDUSTRIAL'
  | 'TOWNLINK'
  | 'TRUNK'
  | '2 TIER FLAT FARE'
  | 'FLAT FARE $1.40'
  | 'NIGHT SERVICE'
  | string; // LTA occasionally adds new categories

/** Operators: SBS Transit, SMRT, Tower Transit, Go-Ahead. */
export type Operator = 'SBST' | 'SMRT' | 'TTS' | 'GAS' | string;

/**
 * A single incoming bus. Every field can be an empty string when the bus
 * is not being tracked, so nothing here should be assumed present.
 */
export interface NextBus {
  OriginCode: string;
  DestinationCode: string;
  /** ISO 8601 with +08:00 offset, or '' when unavailable. */
  EstimatedArrival: string;
  /** 1 = live GPS tracking, 0 = estimated from schedule. */
  Monitored: 0 | 1;
  /** Numeric, but returned as a string. */
  Latitude: string;
  Longitude: string;
  /** '1' or '2' for loop services that pass the stop twice. */
  VisitNumber: string;
  Load: BusLoad;
  Feature: BusFeature;
  Type: BusType;
}

/** One service at a stop, with up to three upcoming buses. */
export interface ArrivalService {
  ServiceNo: string;
  Operator: Operator;
  NextBus: NextBus;
  NextBus2: NextBus;
  NextBus3: NextBus;
}

/** Response from /v3/BusArrival. */
export interface BusArrivalResponse {
  'odata.metadata'?: string;
  BusStopCode: string;
  /** Empty array when no buses are running at this stop. */
  Services: ArrivalService[];
}

/** One physical bus stop. Here Latitude/Longitude ARE numbers. */
export interface BusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
}

/** One direction of one bus service. */
export interface BusService {
  ServiceNo: string;
  Operator: Operator;
  /** 1 or 2. Loop services only have direction 1. */
  Direction: 1 | 2;
  Category: BusCategory;
  OriginCode: string;
  DestinationCode: string;
  /** Frequency ranges in minutes, e.g. '5-08'. May be '-' or ''. */
  AM_Peak_Freq: string;
  AM_Offpeak_Freq: string;
  PM_Peak_Freq: string;
  PM_Offpeak_Freq: string;
  /** Non-empty for loop services, e.g. 'Raffles Blvd'. */
  LoopDesc: string;
}

/** One stop on one service's route. */
export interface BusRoute {
  ServiceNo: string;
  Operator: Operator;
  Direction: 1 | 2;
  /** 1-based position along the route. */
  StopSequence: number;
  BusStopCode: string;
  /** Cumulative km from the route origin. Used for fare estimation. */
  Distance: number;
  /** 'HHMM' 24-hour, e.g. '0500'. '-' when the service does not run. */
  WD_FirstBus: string;
  WD_LastBus: string;
  SAT_FirstBus: string;
  SAT_LastBus: string;
  SUN_FirstBus: string;
  SUN_LastBus: string;
}

/** LTA wraps static datasets in a `value` array. */
export interface DataMallCollection<T> {
  'odata.metadata'?: string;
  value: T[];
}
