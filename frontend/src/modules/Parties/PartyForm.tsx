import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { post, put, get } from "@/services/apiService";
import Validate from "@/lib/Handlevalidation";

// Define interfaces for API responses
interface PartyData {
  id: number;
  partyName: string;
  address: string;
  mobile1: string;
  mobile2: string;
  reference: string;
  referenceMobile1: string;
  referenceMobile2: string;
  createdAt: string;
  updatedAt: string;
}

const partyFormSchema = z.object({
  partyName: z.string()
    .min(1, "Party name is required")
    .max(255, "Party name must not exceed 255 characters"),
    address: z.string()
    .min(1, "Address is required")
    .max(255, "Address must not exceed 255 characters"),
    mobile1: z.string()
    .min(1, "Mobile number is required")
    .max(255, "Mobile number must not exceed 255 characters"),
    mobile2: z.any().optional(),
    reference: z.string()
    .min(1, "Reference is required")
    .max(255, "Reference must not exceed 255 characters"),
    referenceMobile1: z.string()
    .min(1, "Reference mobile number is required")
    .max(255, "Reference mobile number must not exceed 255 characters"),
    referenceMobile2: z.any().optional(),
});

type PartyFormInputs = z.infer<typeof partyFormSchema>;

interface PartyFormProps {
  mode: "create" | "edit";
  partyId?: string;
  onSuccess?: () => void;
  className?: string;
}

const PartyForm = ({
  mode,
  partyId,
  onSuccess,
  className,
}: PartyFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Combined loading party from fetch and mutations

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PartyFormInputs>({
    resolver: zodResolver(partyFormSchema),
    defaultValues: {
      partyName: "",
      address: "",
      mobile1: "",
      mobile2: "",
      reference: "",
      referenceMobile1: "",
      referenceMobile2: "",
    },
  });

  // Query for fetching party data in edit mode
  const { isLoading: isFetchingParty } = useQuery({
    queryKey: ["party", partyId],
    queryFn: async (): Promise<PartyData> => {
      if (!partyId) throw new Error("Party ID is required");
      return get(`/parties/${partyId}`);
    },
    enabled: mode === "edit" && !!partyId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Handle successful party fetch
  useEffect(() => {
    if (mode === "edit" && partyId) {
      queryClient.fetchQuery({
        queryKey: ["party", partyId],
        queryFn: async (): Promise<PartyData> => {
          return get(`/parties/${partyId}`);
        },
      }).then((data) => {
        setValue("partyName", data.partyName);
        setValue("address", data.address);
        setValue("mobile1", data.mobile1);
        setValue("mobile2", data.mobile2);
        setValue("reference", data.reference);
        setValue("referenceMobile1", data.referenceMobile1);
        setValue("referenceMobile2", data.referenceMobile2);
      }).catch((error) => {
        toast.error(error.message || "Failed to fetch party details");
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/parties");
        }
      });
    }
  }, [partyId, mode, setValue, queryClient, navigate, onSuccess]);

  // Mutation for creating a party
  const createPartyMutation = useMutation({
    mutationFn: (data: PartyFormInputs) => {
      return post("/parties", data);
    },
    onSuccess: () => {
      toast.success("Party created successfully");
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/parties");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create party");
      }
    },
  });

  // Mutation for updating a party
  const updatePartyMutation = useMutation({
    mutationFn: (data: PartyFormInputs) => {
      return put(`/parties/${partyId}`, data);
    },
    onSuccess: () => {
      toast.success("Party updated successfully");
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      queryClient.invalidateQueries({ queryKey: ["party", partyId] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/parties");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update party");
      }
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<PartyFormInputs> = (data) => {
    if (mode === "create") {
      createPartyMutation.mutate(data);
    } else {
      updatePartyMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/parties");
    }
  };

  // Combined loading party from fetch and mutations
  const isFormLoading = isFetchingParty || createPartyMutation.isPending || updatePartyMutation.isPending;

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {/* Party Name Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="partyName" className="block mb-2">Party Name <span className="text-red-500">*</span></Label>
          <Input
            id="partyName"
            placeholder="Enter party name"
            {...register("partyName")}
            disabled={isFormLoading}
          />
          {errors.partyName && (
            <span className="mt-1 block text-xs text-destructive">
              {errors.partyName.message}
            </span>
          )}

         
            <Label htmlFor="address" className="block mb-2">Address <span className="text-red-500">*</span></Label>
            <Input
              id="address"
              placeholder="Enter address"
              {...register("address")}
              disabled={isFormLoading}
            />
            {errors.address && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.address.message}
              </span>
            )}


            <div className="grid grid-cols-2 gap-4">
              <div>
            {/* Mobile 1 Field */}
            <Label htmlFor="mobile1" className="block mb-2">Mobile 1 <span className="text-red-500">*</span></Label>
            <Input
              id="mobile1"
              placeholder="Enter mobile number"
              {...register("mobile1")}
              disabled={isFormLoading}
              maxLength={10}
type="number"
            />
            {errors.mobile1 && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.mobile1.message}
              </span>
            )}
            </div>
            <div>
            {/* Mobile 2 Field */}
            <Label htmlFor="mobile2" className="block mb-2">Mobile 2</Label>
            <Input
              id="mobile2"
              placeholder="Enter mobile number"
              {...register("mobile2")}
              disabled={isFormLoading}
              maxLength={10}
type="number"
            />
            {errors.mobile2 && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.mobile2.message}
              </span>
            )}
            </div>
            </div>

            {/* Reference Field */}
            <Label htmlFor="reference" className="block mb-2">Reference <span className="text-red-500">*</span></Label>
            <Input
              id="reference"
              placeholder="Enter reference"
              {...register("reference")}
              disabled={isFormLoading}
            />
            {errors.reference && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.reference.message}
              </span>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                {/* Reference Mobile 1 Field */}
                <Label htmlFor="referenceMobile1" className="block mb-2">Reference Mobile 1 <span className="text-red-500">*</span></Label>
                <Input
                  id="referenceMobile1"
                  placeholder="Enter reference mobile number"
                  {...register("referenceMobile1")}
                  disabled={isFormLoading}
                  maxLength={10}
                  type="number"
                />
                {errors.referenceMobile1 && (
                  <span className="mt-1 block text-xs text-destructive">
                    {errors.referenceMobile1.message}
                  </span>
                )}
              </div>
              <div>
                {/* Reference Mobile 2 Field */}
                <Label htmlFor="referenceMobile2" className="block mb-2">Reference Mobile 2</Label>
                <Input
                  id="referenceMobile2"
                  placeholder="Enter reference mobile number"
                  {...register("referenceMobile2")}
                  disabled={isFormLoading}
                  maxLength={10}
                  type="number"
                 />
                {errors.referenceMobile2 && (
                  <span className="mt-1 block text-xs text-destructive">
                    {errors.referenceMobile2.message}
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
            {mode === "create" ? "Create" : "Update"} Party
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PartyForm;
