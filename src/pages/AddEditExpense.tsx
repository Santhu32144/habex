import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, ArrowLeft, X } from 'lucide-react';
import { useExpenses } from '@/contexts/ExpenseContext';
import { MONTHS, CATEGORIES, MonthData, ExpenseItem, createEmptyMonth } from '@/data/expenseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import QuickCurrencyConvert, { CurrencyConversionDetails } from '@/components/QuickCurrencyConvert';

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

const AddEditExpense: React.FC = () => {
  const { year: editYear, month: editMonth } = useParams();
  const navigate = useNavigate();
  const { getYearData, updateMonth, selectedYear, availableYears } = useExpenses();
  const { toast } = useToast();

  const [formYear, setFormYear] = useState<number>(editYear ? Number(editYear) : selectedYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(editMonth || '');
  const [formData, setFormData] = useState<MonthData>(createEmptyMonth());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get all years for dropdown
  const allYears = Array.from(
    new Set([...availableYears, ...YEARS])
  ).sort((a, b) => b - a);

  useEffect(() => {
    if (editMonth && editYear) {
      const yearData = getYearData(Number(editYear));
      if (yearData[editMonth]) {
        setFormData({ ...yearData[editMonth] });
      }
      setSelectedMonth(editMonth);
      setFormYear(Number(editYear));
    }
  }, [editMonth, editYear, getYearData]);

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    const yearData = getYearData(formYear);
    if (yearData[month]) {
      setFormData({ ...yearData[month] });
    } else {
      setFormData(createEmptyMonth());
    }
  };

  const handleYearChange = (year: number) => {
    setFormYear(year);
    if (selectedMonth) {
      const yearData = getYearData(year);
      if (yearData[selectedMonth]) {
        setFormData({ ...yearData[selectedMonth] });
      } else {
        setFormData(createEmptyMonth());
      }
    }
  };

  // Handle simple array inputs (snacks, food, travelling, petrol)
  const handleSimpleArrayAdd = (category: 'snacks' | 'food' | 'travellingCharge' | 'petrol') => {
    setFormData(prev => ({
      ...prev,
      [category]: [...prev[category], 0],
    }));
  };

  const handleSimpleArrayChange = (
    category: 'snacks' | 'food' | 'travellingCharge' | 'petrol',
    index: number,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].map((v, i) => (i === index ? numValue : v)),
    }));
  };

  const handleSimpleArrayRemove = (
    category: 'snacks' | 'food' | 'travellingCharge' | 'petrol',
    index: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  // Handle detailed expense inputs (otherExpenses, selfExpense)
  const handleDetailedAdd = (category: 'otherExpenses' | 'selfExpense') => {
    setFormData(prev => ({
      ...prev,
      [category]: [...prev[category], { desc: '', amount: 0 }],
    }));
  };

  const handleDetailedChange = (
    category: 'otherExpenses' | 'selfExpense',
    index: number,
    field: 'desc' | 'amount',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].map((item, i) =>
        i === index
          ? { ...item, [field]: field === 'amount' ? parseFloat(value) || 0 : value }
          : item
      ),
    }));
  };

  const handleDetailedRemove = (category: 'otherExpenses' | 'selfExpense', index: number) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedMonth) {
      newErrors.month = 'Please select a month';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    updateMonth(formYear, selectedMonth, formData);
    toast({
      title: 'Expenses saved!',
      description: `${selectedMonth} ${formYear} expenses have been updated successfully.`,
    });
    navigate('/months');
  };

  const handleCurrencyConvert = (details: CurrencyConversionDetails) => {
    navigator.clipboard?.writeText(String(details.inrAmount));

    if (details.storeOriginal) {
      const note = `Foreign currency: ${details.symbol}${details.foreignAmount} ${details.currency} @ ₹${details.rate.toFixed(2)} (${details.source})`;
      setFormData(prev => ({
        ...prev,
        otherExpenses: [...prev.otherExpenses, { desc: note, amount: details.inrAmount }],
      }));
    }

    toast({
      title: 'Converted!',
      description: details.storeOriginal
        ? `₹${details.inrAmount} added to Other Expenses with original currency details.`
        : `₹${details.inrAmount} copied to clipboard — paste into any field below.`,
    });
  };

  const renderSimpleCategory = (
    category: 'snacks' | 'food' | 'travellingCharge' | 'petrol',
    label: string,
    icon: string
  ) => {
    const total = formData[category].reduce((sum, value) => sum + (value || 0), 0);
    return (
      <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div className="flex items-baseline gap-2">
            <h3 className="font-display font-semibold">{label}</h3>
            {total > 0 && <span className="text-sm text-muted-foreground">₹{total.toFixed(0)}</span>}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleSimpleArrayAdd(category)}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {formData[category].length === 0 && (
          <p className="text-sm text-muted-foreground italic">No items yet. Click "Add" to start.</p>
        )}
        {formData[category].map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => handleSimpleArrayChange(category, index, e.target.value)}
              placeholder="Amount"
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => handleSimpleArrayRemove(category, index)}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      </motion.div>
    );
  };

  const renderDetailedCategory = (
    category: 'otherExpenses' | 'selfExpense',
    label: string,
    icon: string
  ) => {
    const total = formData[category].reduce((sum, item) => sum + (item.amount || 0), 0);
    return (
      <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div className="flex items-baseline gap-2">
            <h3 className="font-display font-semibold">{label}</h3>
            {total > 0 && <span className="text-sm text-muted-foreground">₹{total.toFixed(0)}</span>}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleDetailedAdd(category)}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>
      <div className="space-y-3">
        {formData[category].length === 0 && (
          <p className="text-sm text-muted-foreground italic">No items yet. Click "Add" to start.</p>
        )}
        {formData[category].map((item, index) => (
          <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <div className="flex-1 space-y-2">
              <Input
                value={item.desc}
                onChange={(e) => handleDetailedChange(category, index, 'desc', e.target.value)}
                placeholder="Description"
              />
              <Input
                type="number"
                value={item.amount || ''}
                onChange={(e) => handleDetailedChange(category, index, 'amount', e.target.value)}
                placeholder="Amount"
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => handleDetailedRemove(category, index)}
              className="text-destructive hover:text-destructive mt-1"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">
            {editMonth ? 'Edit Expenses' : 'Add Expenses'}
          </h1>
          <p className="text-muted-foreground">
            {editMonth ? `Editing ${editMonth} ${editYear}` : 'Record your monthly expenses'}
          </p>
        </div>
      </div>

      {/* Year and Month Selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="stat-card stat-card-primary"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Select Year</Label>
            <Select value={formYear.toString()} onValueChange={(val) => handleYearChange(Number(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a year..." />
              </SelectTrigger>
              <SelectContent>
                {allYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Select Month</Label>
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className={cn(errors.month && 'border-destructive')}>
                <SelectValue placeholder="Choose a month..." />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.month && (
              <p className="text-sm text-destructive mt-1">{errors.month}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Currency Converter */}
      <QuickCurrencyConvert onConvert={handleCurrencyConvert} />

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderSimpleCategory('snacks', 'Snacks', '🍿')}
        {renderSimpleCategory('food', 'Food', '🍽️')}
        {renderSimpleCategory('travellingCharge', 'Travelling', '🚌')}
        {renderSimpleCategory('petrol', 'Petrol', '⛽')}
        {renderDetailedCategory('otherExpenses', 'Other Expenses', '📦')}
        {renderDetailedCategory('selfExpense', 'Self Expense', '🏠')}
      </div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end gap-4 pt-4"
      >
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="gap-2">
          <Save className="w-4 h-4" />
          Save Expenses
        </Button>
      </motion.div>
    </div>
  );
};

export default AddEditExpense;
