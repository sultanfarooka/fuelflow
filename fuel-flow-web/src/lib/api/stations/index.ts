/**
 * Station-scoped APIs: fuel types, prices, tanks, nozzles.
 * Used by station dashboard and station setup wizard.
 */

export {
  getFuelTypesByStation,
  createFuelType,
  deleteFuelType,
  type FuelTypeDto,
  type createFuelTypePayload as CreateFuelTypeRequest,
  type CreateFuelTypeResponse,
  type FuelTypeListApiResponse,
  type CreateFuelTypeApiResponse,
  type DeleteFuelTypeApiResponse,
} from './fuel-types'

export {
  getFuelPricesByStation,
  setFuelPrice,
  type FuelPricesDto,
  type SetFuelPriceRequest,
  type FuelPriceListApiResponse,
  type SetFuelPriceApiResponse,
} from './fuel-prices'

export {
  getFuelTanksByStation,
  createFuelTank,
  type FuelTankDto,
  type CreateFuelTankRequest,
  type CreateFuelTankResponse,
  type FuelTankListApiResponse,
  type CreateFuelTankApiResponse,
} from './fuel-tanks'

export {
  getFuelNozzlesByStation,
  createFuelNozzle,
  type FuelNozzleDto,
  type CreateFuelNozzleRequest,
  type FuelNozzleListApiResponse,
  type CreateFuelNozzleApiResponse,
} from './fuel-nozzles'
