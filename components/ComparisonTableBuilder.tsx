import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Award, GripVertical, MousePointerClick } from 'lucide-react';
import toast from 'react-hot-toast';
import { ComparisonTable, ComparisonTableColumn, Product } from '../types';
import { Button } from './Button';

interface ComparisonTableBuilderProps {
    tables: ComparisonTable[];
    products: Product[];
    onChange: (tables: ComparisonTable[]) => void;
}

export const ComparisonTableBuilder: React.FC<ComparisonTableBuilderProps> = ({ tables, products, onChange }) => {
    const [editingTable, setEditingTable] = useState<ComparisonTable | null>(null);

    const startNewTable = () => {
        const newTable: ComparisonTable = {
            id: `table-${Date.now()}`,
            title: 'New Comparison Table',
            rowLabels: ['Feature 1', 'Feature 2', 'Feature 3'],
            columns: [
                {
                    id: `col-${Date.now()}-1`,
                    header: 'Option 1',
                    values: ['', '', ''],
                    highlighted: false
                }
            ]
        };
        setEditingTable(newTable);
    };

    const startEditTable = (table: ComparisonTable) => {
        setEditingTable({ ...table });
    };

    const saveTable = () => {
        if (!editingTable) return;

        const existingIndex = tables.findIndex(t => t.id === editingTable.id);
        let newTables: ComparisonTable[];

        if (existingIndex >= 0) {
            newTables = tables.map(t => t.id === editingTable.id ? editingTable : t);
        } else {
            newTables = [...tables, editingTable];
        }

        onChange(newTables);
        setEditingTable(null);
    };

    const deleteTable = (id: string) => {
        if (confirm('Delete this comparison table?')) {
            onChange(tables.filter(t => t.id !== id));
        }
    };

    const cancelEdit = () => {
        setEditingTable(null);
    };

    const addRow = () => {
        if (!editingTable) return;
        setEditingTable({
            ...editingTable,
            rowLabels: [...editingTable.rowLabels, 'New Feature'],
            columns: editingTable.columns.map(col => ({
                ...col,
                values: [...col.values, '']
            }))
        });
    };

    const removeRow = (index: number) => {
        if (!editingTable || editingTable.rowLabels.length <= 1) return;
        setEditingTable({
            ...editingTable,
            rowLabels: editingTable.rowLabels.filter((_, i) => i !== index),
            columns: editingTable.columns.map(col => ({
                ...col,
                values: col.values.filter((_, i) => i !== index)
            }))
        });
    };

    const addColumn = () => {
        if (!editingTable) return;
        const newCol: ComparisonTableColumn = {
            id: `col-${Date.now()}`,
            header: 'New Column',
            values: editingTable.rowLabels.map(() => ''),
            highlighted: false
        };
        setEditingTable({
            ...editingTable,
            columns: [...editingTable.columns, newCol]
        });
    };

    const removeColumn = (colId: string) => {
        if (!editingTable || editingTable.columns.length <= 1) return;
        setEditingTable({
            ...editingTable,
            columns: editingTable.columns.filter(c => c.id !== colId)
        });
    };

    const updateTableTitle = (title: string) => {
        if (!editingTable) return;
        setEditingTable({ ...editingTable, title });
    };

    const updateRowLabel = (index: number, value: string) => {
        if (!editingTable) return;
        const newLabels = [...editingTable.rowLabels];
        newLabels[index] = value;
        setEditingTable({ ...editingTable, rowLabels: newLabels });
    };

    const updateColumnHeader = (colId: string, value: string) => {
        if (!editingTable) return;
        setEditingTable({
            ...editingTable,
            columns: editingTable.columns.map(col =>
                col.id === colId ? { ...col, header: value } : col
            )
        });
    };

    const updateColumnProduct = (colId: string, productId: string) => {
        if (!editingTable) return;
        setEditingTable({
            ...editingTable,
            columns: editingTable.columns.map(col =>
                col.id === colId ? { ...col, productId: productId || undefined } : col
            )
        });
    };

    const updateCellValue = (colId: string, rowIndex: number, value: string) => {
        if (!editingTable) return;
        setEditingTable({
            ...editingTable,
            columns: editingTable.columns.map(col => {
                if (col.id === colId) {
                    const newValues = [...col.values];
                    newValues[rowIndex] = value;
                    return { ...col, values: newValues };
                }
                return col;
            })
        });
    };

    const toggleHighlight = (colId: string) => {
        if (!editingTable) return;
        setEditingTable({
            ...editingTable,
            columns: editingTable.columns.map(col =>
                col.id === colId ? { ...col, highlighted: !col.highlighted } : col
            )
        });
    };

    return (
        <div className="space-y-4">
            {/* Table List */}
            {!editingTable && (
                <>
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Comparison Tables ({tables.length})</h4>
                        <Button size="sm" onClick={startNewTable} className="gap-1 text-xs h-7">
                            <Plus size={14} /> Add Table
                        </Button>
                    </div>

                    {tables.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-500">No comparison tables yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tables.map(table => (
                                <div key={table.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex-1">
                                        <div className="font-medium text-sm text-slate-900 dark:text-white">{table.title}</div>
                                        <div className="text-xs text-slate-500">{table.columns.length} columns × {table.rowLabels.length} rows</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            draggable
                                            onDragStart={(e) => {
                                                const shortcode = `{{table:${table.id}}}`;
                                                e.dataTransfer.setData('text/plain', shortcode);
                                                e.dataTransfer.effectAllowed = 'copy';

                                                // Create a ghost image or just let it be
                                                const ghost = document.createElement('div');
                                                ghost.className = 'bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg';
                                                ghost.innerText = `Table: ${table.title}`;
                                                document.body.appendChild(ghost);
                                                e.dataTransfer.setDragImage(ghost, 0, 0);
                                                setTimeout(() => document.body.removeChild(ghost), 0);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-grab active:cursor-grabbing"
                                            title="Drag and Drop into Content"
                                        >
                                            <GripVertical size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`{{table:${table.id}}}`);
                                                toast.success("Shortcode copied! Paste it in your content.");
                                            }}
                                            className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                            title="Copy Shortcode"
                                        >
                                            <code className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">{"{}"}</code>
                                        </button>
                                        <button
                                            onClick={() => {
                                                // If we had a direct reference to the editor we could insert it
                                                // But since we are across components, we'll suggest copy-paste
                                                // OR we can use a custom event if the editor listens for it.
                                                navigator.clipboard.writeText(`{{table:${table.id}}}`);
                                                toast.success("Shortcode copied! Ready to paste.");
                                            }}
                                            className="p-1.5 text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 rounded"
                                            title="Quick Copy for Insertion"
                                        >
                                            <MousePointerClick size={14} />
                                        </button>
                                        <button onClick={() => startEditTable(table)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" title="Edit">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => deleteTable(table.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Table Editor */}
            {editingTable && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <h4 className="font-bold text-slate-900 dark:text-white">Edit Comparison Table</h4>
                        <button onClick={cancelEdit} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Table Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Table Title</label>
                        <input
                            type="text"
                            value={editingTable.title}
                            onChange={e => updateTableTitle(e.target.value)}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                            placeholder="e.g. Best Laptops Comparison 2024"
                        />
                    </div>

                    {/* Rows and Columns Grid */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border border-slate-200 dark:border-slate-700">
                            <thead>
                                <tr className="bg-slate-100 dark:bg-slate-800">
                                    <th className="p-2 border border-slate-200 dark:border-slate-700 text-left font-semibold w-32">Features</th>
                                    {editingTable.columns.map(col => (
                                        <th key={col.id} className="p-2 border border-slate-200 dark:border-slate-700 min-w-[180px]">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        value={col.header}
                                                        onChange={e => updateColumnHeader(col.id, e.target.value)}
                                                        className="flex-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs dark:text-white"
                                                        placeholder="Column name"
                                                    />
                                                    <button
                                                        onClick={() => removeColumn(col.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                                        title="Remove column"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                                <select
                                                    value={col.productId || ''}
                                                    onChange={e => updateColumnProduct(col.id, e.target.value)}
                                                    className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs dark:text-white"
                                                >
                                                    <option value="">No product link</option>
                                                    {products.filter(p => p.status === 'published').map(p => (
                                                        <option key={p.id} value={p.id}>{p.title.substring(0, 30)}...</option>
                                                    ))}
                                                </select>
                                                <label className="flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={col.highlighted || false}
                                                        onChange={() => toggleHighlight(col.id)}
                                                        className="w-3 h-3 rounded"
                                                    />
                                                    <Award size={12} className="text-amber-500" />
                                                    <span className="text-[10px]">Highlight</span>
                                                </label>
                                            </div>
                                        </th>
                                    ))}
                                    <th className="p-2 border border-slate-200 dark:border-slate-700 w-10">
                                        <button onClick={addColumn} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded w-full" title="Add column">
                                            <Plus size={14} className="mx-auto" />
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {editingTable.rowLabels.map((label, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td className="p-2 border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={label}
                                                    onChange={e => updateRowLabel(rowIndex, e.target.value)}
                                                    className="flex-1 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs dark:text-white font-semibold"
                                                    placeholder="Feature name"
                                                />
                                                <button
                                                    onClick={() => removeRow(rowIndex)}
                                                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                                    title="Remove row"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </td>
                                        {editingTable.columns.map(col => (
                                            <td key={col.id} className="p-2 border border-slate-200 dark:border-slate-700">
                                                <input
                                                    type="text"
                                                    value={col.values[rowIndex] || ''}
                                                    onChange={e => updateCellValue(col.id, rowIndex, e.target.value)}
                                                    className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs dark:text-white"
                                                    placeholder="Value"
                                                />
                                            </td>
                                        ))}
                                        <td className="p-2 border border-slate-200 dark:border-slate-700"></td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={editingTable.columns.length + 2} className="p-2 border border-slate-200 dark:border-slate-700">
                                        <button onClick={addRow} className="w-full p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded text-xs font-medium">
                                            <Plus size={14} className="inline mr-1" /> Add Row
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                        <Button size="sm" onClick={saveTable} className="gap-1">
                            <Save size={14} /> Save Table
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
