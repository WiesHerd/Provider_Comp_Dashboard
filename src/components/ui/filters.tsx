import { Switch } from "./switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { DualRangeSlider } from "./dual-range-slider";

interface FiltersProps {
  showMissingBenchmarks: boolean;
  setShowMissingBenchmarks: (value: boolean) => void;
  showMissingWRVUs: boolean;
  setShowMissingWRVUs: (value: boolean) => void;
  showNonClinicalFTE: boolean;
  setShowNonClinicalFTE: (value: boolean) => void;
  showInactive: boolean;
  setShowInactive: (value: boolean) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  selectedSpecialty: string;
  setSelectedSpecialty: (value: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (value: string) => void;
  fteRange: [number, number];
  setFteRange: (value: [number, number]) => void;
  salaryRange: [number, number];
  setSalaryRange: (value: [number, number]) => void;
  specialties: string[];
  departments: string[];
}

export function Filters({
  showMissingBenchmarks,
  setShowMissingBenchmarks,
  showMissingWRVUs,
  setShowMissingWRVUs,
  showNonClinicalFTE,
  setShowNonClinicalFTE,
  showInactive,
  setShowInactive,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedSpecialty,
  setSelectedSpecialty,
  selectedDepartment,
  setSelectedDepartment,
  fteRange,
  setFteRange,
  salaryRange,
  setSalaryRange,
  specialties,
  departments,
}: FiltersProps) {
  const years = ["2024", "2023", "2022"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Time Period Selection */}
        <div className="space-y-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Toggle Switches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Missing Benchmarks</label>
            <Switch checked={showMissingBenchmarks} onCheckedChange={setShowMissingBenchmarks} />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Missing wRVUs</label>
            <Switch checked={showMissingWRVUs} onCheckedChange={setShowMissingWRVUs} />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Non-Clinical FTE</label>
            <Switch checked={showNonClinicalFTE} onCheckedChange={setShowNonClinicalFTE} />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Inactive</label>
            <Switch checked={showInactive} onCheckedChange={setShowInactive} />
          </div>
        </div>

        {/* Department and Specialty Selection */}
        <div className="space-y-4">
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger>
              <SelectValue placeholder="Select Specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Specialties">All Specialties</SelectItem>
              {specialties.map(specialty => (
                <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Departments">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Range Sliders */}
        <div className="space-y-6">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">FTE Range</label>
            <DualRangeSlider
              value={fteRange}
              onChange={setFteRange}
              min={0}
              max={1}
              step={0.1}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Base Salary Range</label>
            <DualRangeSlider
              value={salaryRange}
              onChange={setSalaryRange}
              min={0}
              max={2000000}
              step={10000}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 