import { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { post, put, get } from "@/services/apiService";
import Validate from "@/lib/Handlevalidation";

// Define interfaces for API responses
interface LoanData {
  partyId: number;
  id: number;
  loanDate: string;
  loanAmount: number;
  balanceAmount: number;
  interest: number;
  balanceInterest: number;
  referenceMobile1: string;
  referenceMobile2: string;
  createdAt: string;
  updatedAt: string;
}

const loanFormSchema = z.object({
  partyId: z.string()
    .nonempty("Party is required"),
  loanDate: z.string()
    .nonempty("Loan date is required"),
    loanAmount: z.string()
    .nonempty("Loan amount is required"),
    balanceAmount: z.string()
    .nonempty("Balance amount is required"),
    interest: z.string()
    .nonempty("Interest is required"),
    balanceInterest: z.string()
    .nonempty("Balance interest is required"),
});

type LoanFormInputs = z.infer<typeof loanFormSchema>;

interface LoanFormProps {
  mode: "create" | "edit";
  loanId?: string;
  onSuccess?: () => void;
  className?: string;
}

const LoanForm = ({
  mode,
  loanId,
  onSuccess,
  className,
}: LoanFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Combined loading loan from fetch and mutations

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LoanFormInputs>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      partyId: "",
      loanDate: "",
      loanAmount: "",
      balanceAmount: "",
      interest: "",
      balanceInterest: "",
    },
  });

  // Query for fetching loan data in edit mode
  const { isLoading: isFetchingLoan } = useQuery({
    queryKey: ["loan", loanId],
    queryFn: async (): Promise<LoanData> => {
      if (!loanId) throw new Error("Loan ID is required");
      return get(`/loans/${loanId}`);
    },
    enabled: mode === "edit" && !!loanId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Handle successful loan fetch
  useEffect(() => {
    if (mode === "edit" && loanId) {
      queryClient.fetchQuery({
        queryKey: ["loan", loanId],
        queryFn: async (): Promise<LoanData> => {
          return get(`/loans/${loanId}`);
        },
      }).then((data) => {
        setValue("partyId", String(data.partyId));
        setValue("loanDate", data.loanDate.slice(0,10));
        setValue("loanAmount", data.loanAmount.toString());
        setValue("balanceAmount", data.balanceAmount.toString());
        setValue("interest", data.interest.toString());
        setValue("balanceInterest", data.balanceInterest.toString());
      }).catch((error) => {
        toast.error(error.message || "Failed to fetch loan details");
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/loans");
        }
      });
    }
  }, [loanId, mode, setValue, queryClient, navigate, onSuccess]);

  // Query for fetching parties for dropdown
  const { data: partiesData, isLoading: isLoadingParties } = useQuery({
    queryKey: ["parties", "all"],
    queryFn: () => get("/parties", { page: 1, limit: 1000, sortBy: "partyName", sortOrder: "asc" }),
    staleTime: 1000 * 60 * 10,
  });

  // Mutation for creating a loan
  const createLoanMutation = useMutation<any, any, any>({
    mutationFn: (data: LoanFormInputs) => {
      return post("/loans", data);
    },
    onSuccess: () => {
      toast.success("Loan created successfully");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/loans");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create loan");
      }
    },
  });

  // Mutation for updating a loan
  const updateLoanMutation = useMutation<any, any, any>({
    mutationFn: (data: LoanFormInputs) => {
      return put(`/loans/${loanId}`, data);
    },
    onSuccess: () => {
      toast.success("Loan updated successfully");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/loans");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update loan");
      }
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<LoanFormInputs> = (data) => {
    // Convert string inputs to numbers to match backend expectations
    const payload = {
      ...data,
      partyId: parseInt(data.partyId, 10),
      loanAmount: Number(data.loanAmount),
      balanceAmount: Number(data.balanceAmount),
      interest: Number(data.interest),
      balanceInterest: Number(data.balanceInterest),
    };
    if (mode === "create") {
      createLoanMutation.mutate(payload);
    } else {
      updateLoanMutation.mutate(payload);
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/loans");
    }
  };

  // Combined loading loan from fetch and mutations
  const isFormLoading = isFetchingLoan || createLoanMutation.isPending || updateLoanMutation.isPending;

  // state for combobox popover
  const [openParty, setOpenParty] = useState(false);

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {/* Party Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="partyId" className="block mb-0">Party <span className="text-red-500">*</span></Label>
          <Controller
            name="partyId"
            control={control}
            render={({ field }) => (
              <Popover open={openParty} onOpenChange={setOpenParty}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={isFormLoading || isLoadingParties}
                  >
                    {field.value
                      ? partiesData?.parties?.find((p: any) => String(p.id) === field.value)?.partyName
                      : isLoadingParties
                      ? "Loading..."
                      : "Select a party"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Search party..." />
                    <CommandEmpty>No party found.</CommandEmpty>
                    <CommandList>
                      {partiesData?.parties?.map((party: any) => (
                        <CommandItem
                          key={party.id}
                          value={party.partyName}
                          onSelect={() => {
                            field.onChange(String(party.id));
                            setOpenParty(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === String(party.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {party.partyName}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.partyId && (
            <span className=" block text-xs text-destructive">
              {errors.partyId.message}
            </span>
          )}
      <div className="grid grid-cols-2 gap-2 relative">
        <div>
          <Label htmlFor="loanDate" className="block mb-2">Loan Date <span className="text-red-500">*</span></Label>
          <Input
          type="date"
            id="loanDate"
            placeholder="Enter loan date"
            {...register("loanDate")}
            disabled={isFormLoading}
          />
          {errors.loanDate && (
            <span className="mt-1 block text-xs text-destructive">
              {errors.loanDate.message}
            </span>
          )}
          </div>
          <div>
            <Label htmlFor="loanAmount" className="block mb-2">Loan Amount <span className="text-red-500">*</span></Label>
            <Input
            type="number"
              id="loanAmount"
              placeholder="Enter loan amount"
              {...register("loanAmount")}
              disabled={isFormLoading}
            />
            {errors.loanAmount && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.loanAmount.message}
              </span>
            )}
            </div>
            </div>
            <div>
            <Label htmlFor="interest" className="block mb-2">Interest (%)<span className="text-red-500">*</span></Label>
            <Input
            type="number"
              id="interest"
              placeholder="Enter interest"
              {...register("interest")}
              disabled={isFormLoading}
            />
            {errors.interest && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.interest.message}
              </span>
            )}
            </div>
      <div className="grid grid-cols-2 gap-2 relative">
        <div>
          <Label htmlFor="balanceAmount" className="block mb-2">Balance Amount <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            id="balanceAmount"
            placeholder="Enter balance amount"
            {...register("balanceAmount")}
            disabled={isFormLoading}
          />
          {errors.balanceAmount && (
            <span className="mt-1 block text-xs text-destructive">
              {errors.balanceAmount.message}
            </span>
          )}
          </div>
          <div>
            <Label htmlFor="balanceInterest" className="block mb-2">Balance Interest <span className="text-red-500">*</span></Label>
            <Input
            type="number"
              id="balanceInterest"
              placeholder="Enter balance interest"
              {...register("balanceInterest")}
              disabled={isFormLoading}
            />
            {errors.balanceInterest && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.balanceInterest.message}
              </span>
            )}
            </div>
            </div>
           
            
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isFormLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isFormLoading}>
            {isFormLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create" : "Update"} Loan
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
