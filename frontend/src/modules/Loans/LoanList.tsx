import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, addMonths, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/formatter";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  LoaderCircle,
  PenSquare,
  Search,
  Trash2,
  PlusCircle,
  List
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CustomPagination from "@/components/common/custom-pagination";
import { get, del } from "@/services/apiService";
// Import components from current directory
import CreateLoan from "./CreateLoan";
import EditLoan from "./EditLoan";

interface Loan {
  id: number;
  loanDate: string;
  loanAmount: number;
  balanceAmount: number;
  interest: number;
  balanceInterest: number;
  partyName: string;
  party?: {
    partyName: string;
    mobile1: string;
    address: string;
  };
}

interface Loan {
  id: number;
  loanDate: string;
  loanAmount: number;
  balanceAmount: number;
  interest: number;
  balanceInterest: number;
  partyName: string;
  party?: {
    partyName: string;
    mobile1: string;
    address: string;
  };
}

interface TableRowData {
  id: number;
  loanDate: string;
  partyName: string;
  party?: {
    partyName: string;
    mobile1: string;
    address: string;
  };
  monthlyAmounts: Record<string, number>;
  totalLoanAmount: number;
  totalBalanceInterest: number;
  interest: number;
}

interface LoansResponse {
  loans: Loan[];
  totalPages: number;
  totalLoans: number;
}

const LoanList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [sortBy] = useState("loanDate");
  const [sortOrder] = useState<"asc" | "desc">("asc");
  const [editLoanId, setEditLoanId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch loans
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<LoansResponse>({
    queryKey: ["loans", page, limit, search, sortBy, sortOrder],
    queryFn: () => get("/loans", { page, limit, search, sortBy, sortOrder }),
  });

  // Delete loan mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/loans/${id}`),
    onSuccess: () => {
      toast.success("Loan deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (error: any) => {
      toast.error(error.errors?.message || error.message || "Failed to delete loan");
    },
  });

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when search changes
  };



  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!data || newPage <= data.totalPages)) {
      setPage(newPage);
    }
  };

  // Handle records per page change
  const handleRecordsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when limit changes
  };

  // Handle edit loan
  const handleEdit = (id: string) => {
    setEditLoanId(id);
    setIsEditDialogOpen(true);
  };

  // Handle dialog close
  const handleCreateDialogClose = () => {
    setIsCreateDialogOpen(false);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditLoanId(null);
  };

  const { tableData, months } = useMemo(() => {
    if (!data?.loans || data.loans.length === 0) {
      const today = new Date();
      const nextMonths = [];
      for (let i = 0; i <= 3; i++) {
        nextMonths.push(format(addMonths(today, i), "MMMM yyyy"));
      }
      return { tableData: [], months: nextMonths };
    }

    const loanMonths = [...new Set(data.loans.map(loan => format(parseISO(loan.loanDate), "MMMM yyyy")))];
    loanMonths.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    const lastMonthDate = new Date(loanMonths[loanMonths.length - 1]);
    const allMonths = [...loanMonths];
    for (let i = 1; i <= 3; i++) {
      const nextMonth = format(addMonths(lastMonthDate, i), "MMMM yyyy");
      if (!allMonths.includes(nextMonth)) {
        allMonths.push(nextMonth);
      }
    }

    const tableData = data.loans.reduce((acc, loan) => {
      const existingEntry = acc.find(entry => entry.partyName === (loan.party?.partyName || loan.partyName));
      const month = format(parseISO(loan.loanDate), "MMMM yyyy");

      if (existingEntry) {
        existingEntry.monthlyAmounts[month] = (existingEntry.monthlyAmounts[month] || 0) + loan.loanAmount;
        existingEntry.totalLoanAmount += loan.loanAmount;
        existingEntry.totalBalanceInterest += loan.balanceInterest;
      } else {
        acc.push({
          id: loan.id,
          loanDate: loan.loanDate,
          partyName: loan.party?.partyName || loan.partyName,
          party: loan.party,
          monthlyAmounts: { [month]: loan.loanAmount },
          totalLoanAmount: loan.loanAmount,
          totalBalanceInterest: loan.balanceInterest,
          interest: loan.interest,
        });
      }
      return acc;
    }, [] as TableRowData[]);

    return { tableData, months: allMonths };
  }, [data]);



  // Handle error loan
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Loans</h2>
        <p>{(error as any)?.message || "Failed to load loans"}</p>
        <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["loans"] })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      
      
      
      <Card className="border border-border">
        <CardHeader className="text-xl font-bold">
          Loans
          <CardDescription>
          Manage loans
        </CardDescription>
        </CardHeader>
      
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Loans by Party Name..."
                value={search}
                onChange={handleSearchChange}
                className="pl-8 w-full"
              />
            </div>

            {/* Action Buttons */}
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

 
          {/* Loans Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Loan Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Loan(Interest)</TableHead>
                   {months.map((month: string) => (
                    <TableHead key={month}>{month}</TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={months.length + 4} className="text-center">
                      <LoaderCircle className="h-8 w-8 animate-spin inline-block" />
                    </TableCell>
                  </TableRow>
                ) : tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={months.length + 4} className="text-center">
                      No loans found.
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map(row => (
                    <TableRow key={row.id}>
                      <TableCell>{format(parseISO(row.loanDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.partyName}</span>
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">{row.party?.mobile1}</span>
                            <span className="text-sm text-muted-foreground">{row.party?.address}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(row.totalLoanAmount)}{" "}
                        <span className="text-sm text-muted-foreground">
                          ({row.interest}%)
                        </span>
                      </TableCell>
                       {months.map(month => (
                        <TableCell key={month}>
                          {row.monthlyAmounts[month] ? formatCurrency(row.monthlyAmounts[month]) : "-"}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/entries?loanId=${row.id}`)}
                            title="Entries"
                          >
                            <List className="h-4 w-4" />
                            <span className="sr-only">Entries</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(row.id.toString())}
                          >
                            <PenSquare className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this loan? <strong>All entries linked to this loan will be deleted as well.</strong> This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(row.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  {deleteMutation.isPending ? (
                                    <>
                                      <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Show</span>
                <select
                  className="border rounded p-1 text-sm"
                  value={limit}
                  onChange={(e) => handleRecordsPerPageChange(Number(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-sm">per page</span>
              </div>
              
              <CustomPagination
                currentPage={page}
                totalPages={data.totalPages}
                onPageChange={handlePageChange}
              />
              
              <div className="text-sm">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.totalLoans)} of {data.totalLoans}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Loan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Loan</DialogTitle>
          </DialogHeader>
          <CreateLoan onSuccess={handleCreateDialogClose} />
        </DialogContent>
      </Dialog>

      {/* Edit Loan Dialog */}
      {editLoanId && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Loan</DialogTitle>
            </DialogHeader>
            <EditLoan loanId={editLoanId} onSuccess={handleEditDialogClose} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LoanList;
