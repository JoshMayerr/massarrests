"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";

// Hardcoded list of Massachusetts towns/cities
const MASSACHUSETTS_TOWNS = [
  "Boston",
  "Worcester",
  "Cambridge",
  "Springfield",
  "Lowell",
  "New Bedford",
  "Quincy",
  "Newton",
  "Brockton",
  "Lynn",
  "Framingham",
  "Waltham",
  "Malden",
  "Medford",
  "Taunton",
  "Plymouth",
  "Salem",
  "Gloucester",
  "Haverhill",
  "Lawrence",
  "Fall River",
  "Chicopee",
  "Everett",
  "Revere",
  "Peabody",
  "Methuen",
  "Chelsea",
  "Somerville",
  "Woburn",
  "Arlington",
  "Beverly",
  "Marblehead",
  "Swampscott",
  "Danvers",
  "Saugus",
  "Reading",
  "Wakefield",
  "Melrose",
  "Stoneham",
  "Winchester",
].sort();

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FilterFormValues {
  town: string;
  dateFrom: string;
  dateTo: string;
}

export default function FilterModal({ open, onOpenChange }: FilterModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<FilterFormValues>({
    defaultValues: {
      town: "",
      dateFrom: "",
      dateTo: "",
    },
  });

  // Initialize form from URL params
  useEffect(() => {
    if (open) {
      form.reset({
        town: searchParams.get("town") || "",
        dateFrom: searchParams.get("dateFrom") || "",
        dateTo: searchParams.get("dateTo") || "",
      });
    }
  }, [open, searchParams, form]);

  const handleApply = (values: FilterFormValues) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update or remove town param
    if (values.town?.trim()) {
      params.set("town", values.town.trim());
    } else {
      params.delete("town");
    }

    // Update or remove dateFrom param
    if (values.dateFrom) {
      params.set("dateFrom", values.dateFrom);
    } else {
      params.delete("dateFrom");
    }

    // Update or remove dateTo param
    if (values.dateTo) {
      params.set("dateTo", values.dateTo);
    } else {
      params.delete("dateTo");
    }

    // Navigate with new params
    router.push(`/?${params.toString()}`);
    onOpenChange(false);
  };

  const handleClear = () => {
    form.reset({
      town: "",
      dateFrom: "",
      dateTo: "",
    });
    router.push("/");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-black max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold uppercase text-black">
            Filter Arrests
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleApply)} className="space-y-4">
            {/* Town Filter */}
            <FormField
              control={form.control}
              name="town"
              render={({ field }) => {
                const [popoverOpen, setPopoverOpen] = useState(false);
                return (
                  <FormItem>
                    <FormLabel className="text-sm font-bold uppercase text-black">
                      Town / City
                    </FormLabel>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={popoverOpen}
                            className="w-full justify-between border-2 border-black bg-white hover:bg-gray-50"
                          >
                            {field.value
                              ? MASSACHUSETTS_TOWNS.find(
                                  (town) => town === field.value
                                )
                              : "All Towns"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        style={{ zIndex: 10000 }}
                        align="start"
                      >
                        <Command>
                          <CommandInput
                            placeholder="Search town..."
                            className="h-9"
                          />
                          <CommandList className="max-h-[300px] overflow-y-auto">
                            <CommandEmpty>No town found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="all towns"
                                onSelect={() => {
                                  field.onChange("");
                                  setPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === "" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                All Towns
                              </CommandItem>
                              {MASSACHUSETTS_TOWNS.map((townName) => (
                                <CommandItem
                                  key={townName}
                                  value={townName}
                                  onSelect={() => {
                                    field.onChange(townName);
                                    setPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === townName
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {townName}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                );
              }}
            />

            {/* Date Range */}
            <div>
              <FormLabel className="text-sm font-bold uppercase text-black mb-2 block">
                Date Range
              </FormLabel>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="dateFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-600">
                        From Date
                      </FormLabel>
                      <FormControl>
                        <input
                          type="date"
                          {...field}
                          className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-600">
                        To Date
                      </FormLabel>
                      <FormControl>
                        <input
                          type="date"
                          {...field}
                          className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="flex-1 border-2 border-black bg-white text-black font-bold uppercase hover:bg-gray-100"
              >
                Clear Filters
              </Button>
              <Button
                type="submit"
                className="flex-1 border-2 border-black bg-black text-white font-bold uppercase hover:bg-gray-800"
              >
                Apply Filters
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
