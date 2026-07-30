import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Pencil, Archive, RotateCcw, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/store/slices/productsSlice';
import { IProduct } from '@/types';

const emptyForm = { name: '', description: '', basePrice: '', unit: 'oyster' };

export default function Products() {
    const dispatch = useAppDispatch();
    const { items: products, loading } = useAppSelector((state) => state.products);
    const [showArchived, setShowArchived] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<IProduct | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(fetchProducts({ all: true }));
    }, [dispatch]);

    const visible = showArchived
        ? products.filter((p) => !p.active)
        : products.filter((p) => p.active);

    const openAdd = () => {
        setEditing(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (product: IProduct) => {
        setEditing(product);
        setForm({
            name: product.name,
            description: product.description || '',
            basePrice: product.basePrice.toString(),
            unit: product.unit || 'oyster',
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.basePrice) {
            toast.error('Name and price are required');
            return;
        }
        setSaving(true);
        const data = {
            name: form.name.trim(),
            description: form.description.trim(),
            basePrice: parseFloat(form.basePrice),
            unit: form.unit,
        };
        try {
            if (editing) {
                await dispatch(updateProduct({ id: editing._id, data })).unwrap();
                toast.success('Product updated');
            } else {
                await dispatch(createProduct(data)).unwrap();
                toast.success(`"${data.name}" added to catalog`);
            }
            setModalOpen(false);
        } catch (err) {
            toast.error(typeof err === 'string' ? err : 'Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (product: IProduct) => {
        try {
            await dispatch(deleteProduct(product._id)).unwrap();
            toast.success(`"${product.name}" archived`);
        } catch {
            toast.error('Failed to archive product');
        }
    };

    const handleRestore = async (product: IProduct) => {
        try {
            await dispatch(updateProduct({ id: product._id, data: { active: true } })).unwrap();
            toast.success(`"${product.name}" restored`);
        } catch {
            toast.error('Failed to restore product');
        }
    };

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-4">Products</h1>
                        <p className="text-muted-foreground">Manage your product catalog</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowArchived(!showArchived)}
                            className="gap-2"
                        >
                            <Archive className="w-4 h-4" />
                            {showArchived ? 'Show Active' : 'Show Archived'}
                        </Button>
                        {!showArchived && (
                            <Button onClick={openAdd} className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Product
                            </Button>
                        )}
                    </div>
                </div>

                {/* Product table */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            {showArchived ? 'Archived Products' : 'Active Products'}
                            <Badge variant="secondary" className="ml-1">{visible.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : visible.length === 0 ? (
                            <p className="text-center text-muted-foreground py-10">
                                {showArchived
                                    ? 'No archived products.'
                                    : 'No active products. Add your first product above.'}
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 text-sm font-medium">Name</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium hidden md:table-cell">Description</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium">Unit</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium">Base Price</th>
                                            <th className="text-center py-3 px-4 text-sm font-medium">Status</th>
                                            <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visible.map((product) => (
                                            <tr key={product._id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-4 font-medium">{product.name}</td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                                                    {product.description || '—'}
                                                </td>
                                                <td className="py-3 px-4 text-sm capitalize">{product.unit}</td>
                                                <td className="py-3 px-4 text-right font-semibold">
                                                    ${product.basePrice.toFixed(2)}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            product.active
                                                                ? 'bg-green-100 text-green-800 border-green-200'
                                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                        }
                                                    >
                                                        {product.active ? 'Active' : 'Archived'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {product.active ? (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    title="Edit"
                                                                    onClick={() => openEdit(product)}
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    title="Archive"
                                                                    className="text-muted-foreground hover:text-red-500"
                                                                    onClick={() => handleArchive(product)}
                                                                >
                                                                    <Archive className="w-4 h-4" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title="Restore"
                                                                className="text-muted-foreground hover:text-green-600"
                                                                onClick={() => handleRestore(product)}
                                                            >
                                                                <RotateCcw className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Add / Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={(open) => { if (!saving) setModalOpen(open); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label>Name *</Label>
                            <Input
                                placeholder="e.g. Oysterponds White Label"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Description</Label>
                            <Input
                                placeholder="Optional description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Base Price *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={form.basePrice}
                                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Unit</Label>
                                <Select
                                    value={form.unit}
                                    onValueChange={(v) => setForm({ ...form, unit: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="oyster">Oyster</SelectItem>
                                        <SelectItem value="dozen">Dozen</SelectItem>
                                        <SelectItem value="piece">Piece</SelectItem>
                                        <SelectItem value="pound">Pound</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setModalOpen(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {editing ? 'Save Changes' : 'Add Product'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
