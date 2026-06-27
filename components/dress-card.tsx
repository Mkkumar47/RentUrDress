import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { ApiDress } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DressCardProps = {
  dress: ApiDress;
  onRent?: (dress: ApiDress) => void;
  rentButtonLabel?: string;
};

export function DressCard({ dress, onRent, rentButtonLabel }: DressCardProps) {
  return (
    <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ duration: 0.25 }}>
      <Card className="overflow-hidden">
        <div
          className="h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${dress.imageUrl})` }}
          aria-label={`${dress.title} image`}
        />
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{dress.title}</CardTitle>
            <Badge tone={dress.isAvailable ? "success" : "warning"}>
              {dress.isAvailable ? "Available" : "Rented"}
            </Badge>
          </div>
          <CardDescription>
            {dress.brand} · {dress.category} · Size {dress.size}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">{dress.description}</p>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <MapPin className="h-4 w-4 text-cyan-300" />
            <span>
              {dress.location.city}, {dress.location.state}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Owner: {dress.owner.name}</p>
            <p className="text-lg font-semibold text-fuchsia-200">
              ₹{dress.dailyRent.toLocaleString()}/day
            </p>
          </div>
        </CardContent>
        {onRent ? (
          <CardFooter>
            <p className="text-xs text-slate-400">
              Deposit ₹{dress.securityDeposit.toLocaleString()}
            </p>
            <Button
              onClick={() => onRent(dress)}
              disabled={!dress.isAvailable}
              aria-label={`Rent ${dress.title}`}
              className="h-9 px-4"
            >
              {rentButtonLabel ?? "Rent with PhonePe"}
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </motion.div>
  );
}
