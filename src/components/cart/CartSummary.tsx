import { useMemo } from 'react';
import { Info } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface CartSummaryProps {
  subtotal: number;
  shippingCost?: number;
  taxRate?: number;
  discountAmount?: number;
  compact?: boolean;
}

export default function CartSummary({
  subtotal,
  shippingCost = 0,
  taxRate = 0.08,
  discountAmount = 0,
  compact = false,
}: CartSummaryProps) {
  const calculations = useMemo(() => {
    const tax = subtotal * taxRate;
    const total = subtotal + tax + shippingCost - discountAmount;
    
    return {
      tax,
      total: Math.max(0, total),
    };
  }, [subtotal, taxRate, shippingCost, discountAmount]);

  const SummaryRow = ({ 
    label, 
    value, 
    bold = false,
    tooltip,
  }: { 
    label: string; 
    value: string; 
    bold?: boolean;
    tooltip?: string;
  }) => (
    <div className={`flex items-center justify-between ${bold ? 'text-lg font-bold' : 'text-sm'}`}>
      <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
        {label}
        {tooltip && (
          <button
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            title={tooltip}
            aria-label={tooltip}
          >
            <Info className="h-4 w-4" />
          </button>
        )}
      </span>
      <span className={bold ? 'text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'}>
        {value}
      </span>
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <SummaryRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
        
        {shippingCost > 0 && (
          <SummaryRow label="Shipping" value={`$${shippingCost.toFixed(2)}`} />
        )}
        
        <SummaryRow 
          label={`Tax (${(taxRate * 100).toFixed(0)}%)`}
          value={`$${calculations.tax.toFixed(2)}`}
        />
        
        {discountAmount > 0 && (
          <SummaryRow 
            label="Discount" 
            value={`-$${discountAmount.toFixed(2)}`}
          />
        )}
        
        <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
          <SummaryRow 
            label="Total" 
            value={`$${calculations.total.toFixed(2)}`}
            bold
          />
        </div>
      </div>
    );
  }

  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <CardTitle className="text-xl">Order Summary</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            <SummaryRow 
              label="Subtotal" 
              value={`$${subtotal.toFixed(2)}`}
              tooltip="Total before taxes and shipping"
            />
            
            <SummaryRow 
              label="Shipping" 
              value={shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'Calculated at checkout'}
              tooltip={shippingCost > 0 ? undefined : "Shipping cost will be calculated based on your location"}
            />
            
            <SummaryRow 
              label={`Tax (${(taxRate * 100).toFixed(0)}%)`}
              value={`$${calculations.tax.toFixed(2)}`}
              tooltip="Estimated sales tax"
            />
            
            {discountAmount > 0 && (
              <SummaryRow 
                label="Discount" 
                value={`-$${discountAmount.toFixed(2)}`}
              />
            )}
          </div>

          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <SummaryRow 
              label="Total" 
              value={`$${calculations.total.toFixed(2)}`}
              bold
            />
          </div>

          {subtotal > 0 && subtotal < 100 && (
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Add ${(100 - subtotal).toFixed(2)} more for free shipping!
              </p>
            </div>
          )}

          {subtotal >= 100 && (
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                🎉 You qualify for free shipping!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
