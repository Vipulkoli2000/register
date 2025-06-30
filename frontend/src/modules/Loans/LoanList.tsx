import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
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
import { Separator } from "@/components/ui/separator";
import {
  LoaderCircle,
  PenSquare,
  Search,
  Trash2,
  ChevronUp,
  ChevronDown,
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
import CreateLoan from "./CreateLOan";
import EditLoan from "./EditLoan";

const LoanList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("loanDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
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
  } = useQuery({
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

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1); // Reset to first page when sort changes
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
          <div className="flex flex-wrap items-center gap-4 mb-4 ">
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
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
               
                  <TableHead>Party</TableHead>
                  <TableHead className="w-auto cursor-pointer" onClick={() => handleSort("loanDate")}>
                    Loan Date
                    {sortBy === "loanDate" && (
                      <span className="ml-2 inline-block">
                        {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Balance Amount</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Balance Interest</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <LoaderCircle className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2">Loading loans...</p>
                    </TableCell>
                  </TableRow>
                ) : data?.loans?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No loans found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.loans?.map((loan: any) => (
                    <TableRow key={loan.id}>
                      <TableCell>{loan.party?.partyName || loan.partyName}</TableCell>
                       <TableCell>{format(new Date(loan.loanDate), "dd-MM-yyyy")}</TableCell>
                      <TableCell>{loan.loanAmount}</TableCell>
                      <TableCell>{loan.balanceAmount}</TableCell>
                      <TableCell>{loan.interest}</TableCell>
                      <TableCell>{loan.balanceInterest}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                              {/* Entries Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/entries?loanId=${loan.id}`)}
                                title="Entries"
                              >
                                <List className="h-4 w-4" />
                                <span className="sr-only">Entries</span>
                              </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(loan.id.toString())}
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
                                  onClick={() => deleteMutation.mutate(loan.id)}
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
            <div className="flex justify-between items-center mt-4">
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
                totalRecords={data.totalLoans}
                recordsPerPage={limit}
                onPageChange={handlePageChange}
                onRecordsPerPageChange={handleRecordsPerPageChange}
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
