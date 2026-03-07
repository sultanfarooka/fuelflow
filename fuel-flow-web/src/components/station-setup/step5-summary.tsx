import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getFuelTypesByStation,
  getFuelPricesByStation,
  getFuelTanksByStation,
  getFuelNozzlesByStation,
  type FuelTypeDto,
  type FuelPricesDto,
  type FuelTankDto,
  type FuelNozzleDto,
} from "@/lib/api/stations";

type Step5SummaryProps = {
  stationId: string;
  onFinish: () => void;
  onBack: () => void;
};

export function Step5Summary({ stationId, onFinish, onBack }: Step5SummaryProps) {
  const { data: typesData } = useQuery({
    queryKey: ["stations", stationId, "fuel-types"],
    queryFn: () => getFuelTypesByStation(stationId),
    enabled: !!stationId,
  });
  const { data: pricesData } = useQuery({
    queryKey: ["stations", stationId, "fuel-prices"],
    queryFn: () => getFuelPricesByStation(stationId),
    enabled: !!stationId,
  });
  const { data: tanksData } = useQuery({
    queryKey: ["stations", stationId, "fuel-tanks"],
    queryFn: () => getFuelTanksByStation(stationId),
    enabled: !!stationId,
  });
  const { data: nozzlesData } = useQuery({
    queryKey: ["stations", stationId, "fuel-nozzles"],
    queryFn: () => getFuelNozzlesByStation(stationId),
    enabled: !!stationId,
  });

  const types = typesData?.data ?? [];
  const prices = pricesData?.data ?? [];
  const tanks = tanksData?.data ?? [];
  const nozzles = nozzlesData?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>
          Review your setup. Click Finish to go to the station dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium">Product types ({types.length})</h3>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {types.map((t: FuelTypeDto) => (
              <li key={t.id}>
                {t.name} ({t.unit})
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium">Prices ({prices.length})</h3>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {prices.map((p: FuelPricesDto) => (
              <li key={p.id}>
                {p.fuelTypeName ?? p.fuelTypeId}: {p.price}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium">Tanks ({tanks.length})</h3>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {tanks.map((t: FuelTankDto) => (
              <li key={t.id}>
                {t.name || "Tank"} — {t.capacityLiters} L
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium">Nozzles ({nozzles.length})</h3>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {nozzles.map((n: FuelNozzleDto) => (
              <li key={n.id}>Nozzle {n.nozzleNumber}</li>
            ))}
          </ul>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onFinish}>Finish</Button>
        </div>
      </CardContent>
    </Card>
  );
}

