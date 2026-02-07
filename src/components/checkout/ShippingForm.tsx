import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const shippingSchema = z.object({
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  country: z.string().min(2, 'Country is required'),
});

export type ShippingFormData = z.infer<typeof shippingSchema>;

interface ShippingFormProps {
  initialData?: ShippingFormData | null;
  onSubmit: (data: ShippingFormData) => void;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
];

export default function ShippingForm({ initialData, onSubmit }: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: initialData || {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
    },
  });

  const selectedCountry = watch('country');

  return (
    <form id="shipping-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Shipping Address
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter the address where you'd like your order delivered.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Street Address"
          placeholder="123 Main St, Apt 4B"
          error={errors.street?.message}
          required
          fullWidth
          {...register('street')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="City"
            placeholder="New York"
            error={errors.city?.message}
            required
            fullWidth
            {...register('city')}
          />

          <Select
            label="State"
            error={errors.state?.message}
            required
            fullWidth
            options={US_STATES}
            placeholder="Select a state"
            {...register('state')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="ZIP Code"
            placeholder="10001"
            error={errors.zip?.message}
            required
            fullWidth
            {...register('zip')}
          />

          <Select
            label="Country"
            error={errors.country?.message}
            required
            fullWidth
            options={COUNTRIES}
            {...register('country')}
          />
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
          📦 Shipping Information
        </h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>• Standard shipping: 5-7 business days</li>
          <li>• Express shipping: 2-3 business days</li>
          <li>• Free shipping on orders over $100</li>
        </ul>
      </div>
    </form>
  );
}
