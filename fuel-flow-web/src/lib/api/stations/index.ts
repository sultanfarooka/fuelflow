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
  updateFuelTank,
  deleteFuelTank,
  type FuelTankDto,
  type CreateFuelTankRequest,
  type CreateFuelTankResponse,
  type UpdateFuelTankRequest,
  type UpdateFuelTankApiResponse,
  type FuelTankListApiResponse,
  type CreateFuelTankApiResponse,
  type DeleteFuelTankApiResponse,
} from './fuel-tanks'

export {
  getDipChart,
  uploadDipChart,
  type DipChartDto,
  type DipChartEntryDto,
  type UploadDipChartEntry,
  type UploadDipChartRequest,
  type GetDipChartApiResponse,
  type UploadDipChartApiResponse,
} from './dip-chart'

export {
  getFuelNozzlesByStation,
  createFuelNozzle,
  type FuelNozzleDto,
  type CreateFuelNozzleRequest,
  type FuelNozzleListApiResponse,
  type CreateFuelNozzleApiResponse,
  deleteFuelNozzle,
  type DeleteFuelNozzleApiResponse,
} from './fuel-nozzles'
