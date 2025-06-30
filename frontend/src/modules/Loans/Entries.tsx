import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  LoaderCircle,
  PlusCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import CustomPagination from "@/components/common/custom-pagination";
import { motion, AnimatePresence } from "framer-motion";
import { get, post } from "@/services/apiService";

// -------------------- TYPES --------------------
interface Entry {
  id: number;
  loanId: number;
  entryDate: string;
  balanceAmount: number;
  interestAmount: number;
  receivedDate?: string | null;
  receivedAmount?: number | null;
  receivedInterest?: number | null;
  loan?: { partyId: number };
}

interface PaginatedEntriesResponse {
  entries: Entry[];
  page: number;
  totalPages: number;
  totalEntries: number;
}

// -------------------- COMPONENT --------------------
const Entries = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const loanIdParam = searchParams.get("loanId");
  const partyIdParam = searchParams.get("partyId");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("entryDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const queryClient = useQueryClient();

  // Disable body scroll when this page is mounted
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Fetch entries
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<PaginatedEntriesResponse, any>({
    queryKey: [
      "entries",
      { page, limit, sortBy, sortOrder, loanIdParam, partyIdParam },
    ],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      if (loanIdParam) params.loanId = loanIdParam;
      // Backend currently only supports loanId filter.
      const res = await get("/entries", params);
      if (partyIdParam) {
        res.entries = res.entries.filter(
          (e: Entry) => e.loan?.partyId === Number(partyIdParam)
        );
      }
      return res;
    },
    keepPreviousData: true,
  });

  // -------------------- CREATE ENTRY MUTATION --------------------
  const createMutation = useMutation({
    mutationFn: (payload: Partial<Entry>) => post("/entries", payload),
    onSuccess: () => {
      toast.success("Entry created successfully");
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      setShowCreateForm(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create entry");
    },
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // -------------------- RENDER --------------------
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Entries</h1>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" /> {showCreateForm ? 'Hide Form' : 'Add Entry'}
        </Button>
      </div>

      {/* Create Entry Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            key="create-entry-form"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <span className="font-medium">Create Entry</span>
              </CardHeader>
              <CardContent>
                <CreateEntryForm
                  loanIdPrefill={loanIdParam ? Number(loanIdParam) : undefined}
                  onSubmit={(payload) => createMutation.mutate(payload)}
                  isSubmitting={createMutation.isLoading}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="font-medium">Entries List</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-destructive py-4">
              {error.message || "Failed to load entries"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("entryDate")}
                    >
                      Entry Date
                      {sortBy === "entryDate" && (
                        <span className="inline-block ml-1">
                          {sortOrder === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </TableHead>
                    <TableHead>Balance Amount</TableHead>
                    <TableHead>Interest Amount</TableHead>
                    <TableHead>Received Amount</TableHead>
                    <TableHead>Received Interest</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.entries.length ? (
                    data.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                        <TableCell>{entry.balanceAmount}</TableCell>
                        <TableCell>{entry.interestAmount}</TableCell>
                        <TableCell>{entry.receivedAmount ?? "-"}</TableCell>
                        <TableCell>{entry.receivedInterest ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        No entries found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="mt-4">
                  <CustomPagination
                    page={page}
                    totalPages={data.totalPages}
                    onPageChange={(p) => setPage(p)}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

// -------------------- CREATE ENTRY FORM --------------------
interface CreateEntryFormProps {
  loanIdPrefill?: number;
  onSubmit: (payload: any) => void;
  isSubmitting: boolean;
}

const CreateEntryForm = ({
  loanIdPrefill,
  onSubmit,
  isSubmitting,
}: CreateEntryFormProps) => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [form, setForm] = useState({
    loanId: loanIdPrefill ?? "",
    entryDate: getTodayDate(),
    balanceAmount: "",
    balanceInterest: "",
    interestPercentage: "",
    interestAmount: "",
    totalPendingInterest: "",
    receivedDate: "",
    receivedAmount: "",
    receivedInterest: "",
  });
  
  const [isLoadingLoanDetails, setIsLoadingLoanDetails] = useState(false);

  // Auto-fetch loan details if loan ID is prefilled
  React.useEffect(() => {
    if (loanIdPrefill) {
      fetchLoanDetails(loanIdPrefill.toString());
    }
  }, [loanIdPrefill]);

  // Fetch loan details when loan ID changes
  const fetchLoanDetails = async (loanId: string) => {
    if (!loanId || isNaN(Number(loanId))) return;
    
    setIsLoadingLoanDetails(true);
    try {
      const response = await get(`/entries/loan/${loanId}/details`);
      setForm(prev => ({
        ...prev,
        balanceAmount: response.balanceAmount.toString(),
        balanceInterest: response.balanceInterest.toString(),
        interestPercentage: response.interest.toString(),
        interestAmount: response.calculatedInterestAmount.toString(),
        totalPendingInterest: response.totalPendingInterest.toString(),
      }));
    } catch (error) {
      console.error('Failed to fetch loan details:', error);
      toast.error('Failed to fetch loan details');
    } finally {
      setIsLoadingLoanDetails(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Auto-fetch loan details when loan ID changes
    if (name === 'loanId' && value && !isNaN(Number(value))) {
      fetchLoanDetails(value);
    }
  };
  
  // Calculate interest amount when balance or interest percentage changes
  const calculateInterestAmount = (balance: string, percentage: string) => {
    const balanceNum = parseFloat(balance) || 0;
    const percentageNum = parseFloat(percentage) || 0;
    return ((balanceNum * percentageNum) / 100).toString();
  };
  
  const handleBalanceOrPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    
    if (name === 'balanceAmount' || name === 'interestPercentage') {
      const newBalance = name === 'balanceAmount' ? value : form.balanceAmount;
      const newPercentage = name === 'interestPercentage' ? value : form.interestPercentage;
      updatedForm.interestAmount = calculateInterestAmount(newBalance, newPercentage);
    }
    
    setForm(updatedForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      loanId: Number(form.loanId),
      entryDate: form.entryDate,
      // Note: balanceAmount and interestAmount are now calculated on the backend
    };
    if (form.receivedDate) payload.receivedDate = form.receivedDate;
    if (form.receivedAmount) payload.receivedAmount = Number(form.receivedAmount);
    if (form.receivedInterest)
      payload.receivedInterest = Number(form.receivedInterest);
    onSubmit(payload);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {!loanIdPrefill && (
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="loanId">
            Loan ID <span className="text-red-500">*</span>
          </label>
          <Input
            id="loanId"
            name="loanId"
            type="number"
            value={form.loanId}
            onChange={handleChange}
            required
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="entryDate">
            Entry Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="entryDate"
            name="entryDate"
            type="date"
            value={form.entryDate}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      {/* Auto-populated loan details */}
      {form.loanId && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="balanceAmount">
                Current Balance Amount
              </label>
              <Input
                id="balanceAmount"
                name="balanceAmount"
                type="number"
                step="0.01"
                value={form.balanceAmount}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="balanceInterest">
                Current Balance Interest
              </label>
              <Input
                id="balanceInterest"
                name="balanceInterest"
                type="number"
                step="0.01"
                value={form.balanceInterest}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="interestPercentage">
                Interest Rate %
              </label>
              <Input
                id="interestPercentage"
                name="interestPercentage"
                type="number"
                step="0.01"
                value={form.interestPercentage}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="interestAmount">
                New Interest Amount
              </label>
              <Input
                id="interestAmount"
                name="interestAmount"
                type="number"
                step="0.01"
                value={form.interestAmount}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Interest Calculation Breakdown</h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-blue-800">
              <div>Interest on Balance: {form.balanceAmount} × {form.interestPercentage}% = <span className="font-semibold">{((parseFloat(form.balanceAmount || '0') * parseFloat(form.interestPercentage || '0')) / 100).toFixed(2)}</span></div>
              <div>Current Balance Interest: <span className="font-semibold">{form.balanceInterest}</span></div>
              <div className="border-t pt-2 mt-2 font-semibold">
                <div>New Interest Amount: {((parseFloat(form.balanceAmount || '0') * parseFloat(form.interestPercentage || '0')) / 100).toFixed(2)} + {form.balanceInterest} = <span className="text-lg">{form.interestAmount}</span></div>
              </div>
              <div className="border-t pt-2 mt-2">
                <div>Total After Adding New Interest: <span className="font-semibold">{form.totalPendingInterest}</span></div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="receivedDate">
            Received Date
          </label>
          <Input
            id="receivedDate"
            name="receivedDate"
            type="date"
            value={form.receivedDate}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="receivedAmount">
            Received Amount
          </label>
          <Input
            id="receivedAmount"
            name="receivedAmount"
            type="number"
            step="0.01"
            value={form.receivedAmount}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="receivedInterest">
          Received Interest
        </label>
        <Input
          id="receivedInterest"
          name="receivedInterest"
          type="number"
          step="0.01"
          value={form.receivedInterest}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Create Entry
        </Button>
      </div>
    </form>
  );
};

export default Entries;




