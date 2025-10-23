import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { reportService } from '@/services/reportService';
import { formatIndianCurrency } from '@/utils/currency';
import { Plus, Trash2, Download } from 'lucide-react';


interface BillItem {
  particulars: string;
  quantity: number;
  rate: number;
  amount: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  remark: string;
}

interface Bill {
  billNo: string;
  billDate: string;
  vendor: string;
  items: BillItem[];
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ReportsForm() {
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([
    {
      billNo: '',
      billDate: '',
      vendor: '',
      items: [
        {
          particulars: '',
          quantity: 0,
          rate: 0,
          amount: 0,
          cgst: 0,
          sgst: 0,
          grandTotal: 0,
          remark: '',
        },
      ],
    },
  ]);

  const calculateItemTotals = (item: BillItem): BillItem => {
    const amount = item.quantity * item.rate;
    const cgstAmount = (amount * item.cgst) / 100;
    const sgstAmount = (amount * item.sgst) / 100;
    const grandTotal = amount + cgstAmount + sgstAmount;

    return {
      ...item,
      amount,
      grandTotal,
    };
  };

  const updateItem = (billIndex: number, itemIndex: number, field: keyof BillItem, value: string | number) => {
    const newBills = [...bills];
    const updatedItem = { ...newBills[billIndex].items[itemIndex], [field]: value };
    newBills[billIndex].items[itemIndex] = calculateItemTotals(updatedItem);
    setBills(newBills);
  };

  const updateBill = (billIndex: number, field: keyof Bill, value: string) => {
    const newBills = [...bills];
    (newBills[billIndex] as any)[field] = value;
    setBills(newBills);
  };

  const addBill = () => {
    setBills([
      ...bills,
      {
        billNo: '',
        billDate: '',
        vendor: '',
        items: [
          {
            particulars: '',
            quantity: 0,
            rate: 0,
            amount: 0,
            cgst: 0,
            sgst: 0,
            grandTotal: 0,
            remark: '',
          },
        ],
      },
    ]);
  };

  const removeBill = (billIndex: number) => {
    if (bills.length > 1) {
      setBills(bills.filter((_, index) => index !== billIndex));
    }
  };

  const addItem = (billIndex: number) => {
    const newBills = [...bills];
    newBills[billIndex].items.push({
      particulars: '',
      quantity: 0,
      rate: 0,
      amount: 0,
      cgst: 0,
      sgst: 0,
      grandTotal: 0,
      remark: '',
    });
    setBills(newBills);
  };

  const removeItem = (billIndex: number, itemIndex: number) => {
    const newBills = [...bills];
    if (newBills[billIndex].items.length > 1) {
      newBills[billIndex].items.splice(itemIndex, 1);
      setBills(newBills);
    }
  };

  const getBillTotal = (bill: Bill): number => {
    return bill.items.reduce((sum, item) => sum + item.grandTotal, 0);
  };

  const getOverallTotal = (): number => {
    return bills.reduce((sum, bill) => sum + getBillTotal(bill), 0);
  };

  const handleExportToExcel = async () => {
    try {
      const blob = await reportService.exportMultiItemBillToExcel(bills);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Department_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Report exported to Excel successfully',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export to Excel',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Multi-Item Bill Report</h2>
        <div className="flex gap-2">
          <Button onClick={addBill} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Bill
          </Button>
          <Button onClick={handleExportToExcel} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      {bills.map((bill, billIndex) => (
        <motion.div
          key={billIndex}
          initial="hidden"
          animate="visible"
          variants={itemVariants}
          transition={{ delay: billIndex * 0.1 }}
        >
          <Card className="p-6 mb-6 shadow-lg rounded-xl bg-white border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Bill #{billIndex + 1}</h3>
              {bills.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBill(billIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Bill Header Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Bill Date</Label>
                <FormInput
                  type="date"
                  value={bill.billDate}
                  onChange={(e) => updateBill(billIndex, 'billDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bill No</Label>
                <FormInput
                  value={bill.billNo}
                  onChange={(e) => updateBill(billIndex, 'billNo', e.target.value)}
                  placeholder="Enter bill number"
                />
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <FormInput
                  value={bill.vendor}
                  onChange={(e) => updateBill(billIndex, 'vendor', e.target.value)}
                  placeholder="Enter vendor name"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium">Particulars</th>
                    <th className="text-left p-2 text-sm font-medium">Quantity</th>
                    <th className="text-left p-2 text-sm font-medium">Rate</th>
                    <th className="text-left p-2 text-sm font-medium">Amount</th>
                    <th className="text-left p-2 text-sm font-medium">CGST (%)</th>
                    <th className="text-left p-2 text-sm font-medium">SGST (%)</th>
                    <th className="text-left p-2 text-sm font-medium">Grand Total</th>
                    <th className="text-left p-2 text-sm font-medium">Remark</th>
                    <th className="text-left p-2 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((item, itemIndex) => (
                    <tr key={itemIndex} className="border-b">
                      <td className="p-2">
                        <FormInput
                          value={item.particulars}
                          onChange={(e) => updateItem(billIndex, itemIndex, 'particulars', e.target.value)}
                          placeholder="Item description"
                          className="min-w-[150px]"
                        />
                      </td>
                      <td className="p-2">
                        <FormInput
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(billIndex, itemIndex, 'quantity', Number(e.target.value))}
                          className="w-20"
                        />
                      </td>
                      <td className="p-2">
                        <FormInput
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateItem(billIndex, itemIndex, 'rate', Number(e.target.value))}
                          className="w-24"
                        />
                      </td>
                      <td className="p-2">
                        <span className="text-sm font-medium">{formatIndianCurrency(item.amount)}</span>
                      </td>
                      <td className="p-2">
                        <FormInput
                          type="number"
                          step="0.01"
                          value={item.cgst}
                          onChange={(e) => updateItem(billIndex, itemIndex, 'cgst', Number(e.target.value))}
                          className="w-20"
                        />
                      </td>
                      <td className="p-2">
                        <FormInput
                          type="number"
                          step="0.01"
                          value={item.sgst}
                          onChange={(e) => updateItem(billIndex, itemIndex, 'sgst', Number(e.target.value))}
                          className="w-20"
                        />
                      </td>
                      <td className="p-2">
                        <span className="text-sm font-bold text-primary">{formatIndianCurrency(item.grandTotal)}</span>
                      </td>
                      <td className="p-2">
                        <FormInput
                          value={item.remark}
                          onChange={(e) => updateItem(billIndex, itemIndex, 'remark', e.target.value)}
                          placeholder="Remark"
                          className="min-w-[100px]"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addItem(billIndex)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          {bill.items.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(billIndex, itemIndex)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bill Total */}
            <div className="text-right font-semibold mt-4">
              <span className="text-lg">Bill Total: {formatIndianCurrency(getBillTotal(bill))}</span>
            </div>
          </Card>
        </motion.div>
      ))}

      {/* Overall Total */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="text-right font-bold text-xl text-primary">
          Overall Total: {formatIndianCurrency(getOverallTotal())}
        </div>
      </Card>
    </div>
  );
}