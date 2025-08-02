import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Settings } from 'lucide-react';

interface Category {
  id: string;
  label: string;
  icon: string;
}

interface CategoryManagerProps {
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  isHost: boolean;
}

const DEFAULT_ICONS = ['📝', '🎯', '🌟', '🎨', '🎪', '🎭', '🎪', '🎸', '⚽', '🍎', '🚗', '🏠', '📚', '🌍', '💎', '🎊'];

export const CategoryManager = ({ categories, onUpdateCategories, isHost }: CategoryManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);
  const [newCategory, setNewCategory] = useState({ label: '', icon: '📝' });

  const addCategory = () => {
    if (!newCategory.label.trim()) return;
    
    const category: Category = {
      id: Math.random().toString(36).substring(2, 9),
      label: newCategory.label.trim(),
      icon: newCategory.icon
    };
    
    setLocalCategories([...localCategories, category]);
    setNewCategory({ label: '', icon: '📝' });
  };

  const removeCategory = (categoryId: string) => {
    setLocalCategories(localCategories.filter(cat => cat.id !== categoryId));
  };

  const updateCategory = (categoryId: string, updates: Partial<Category>) => {
    setLocalCategories(localCategories.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    ));
  };

  const saveChanges = () => {
    onUpdateCategories(localCategories);
    setIsOpen(false);
  };

  const resetToDefault = () => {
    const defaultCategories: Category[] = [
      { id: 'nome', label: 'Nome', icon: '👤' },
      { id: 'animal', label: 'Animal', icon: '🐾' },
      { id: 'cor', label: 'Cor', icon: '🎨' },
      { id: 'objeto', label: 'Objeto', icon: '📦' },
      { id: 'filme', label: 'Filme', icon: '🎬' },
      { id: 'cep', label: 'CEP', icon: '📍' },
      { id: 'comida', label: 'Comida', icon: '🍕' },
      { id: 'profissao', label: 'Profissão', icon: '💼' }
    ];
    setLocalCategories(defaultCategories);
  };

  if (!isHost) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Gerenciar Categorias ({categories.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gerenciar Categorias do Jogo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Categorias Atuais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {localCategories.map((category) => (
                <Card key={category.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Input
                        value={category.icon}
                        onChange={(e) => updateCategory(category.id, { icon: e.target.value })}
                        className="w-12 h-8 text-center text-sm"
                        maxLength={2}
                      />
                      <Input
                        value={category.label}
                        onChange={(e) => updateCategory(category.id, { label: e.target.value })}
                        className="flex-1 h-8 text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCategory(category.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Add New Category */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Adicionar Nova Categoria</h3>
            <Card className="p-4">
              <div className="flex gap-2">
                <div className="flex-shrink-0">
                  <select
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    className="w-12 h-10 text-center border rounded-md text-sm"
                  >
                    {DEFAULT_ICONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <Input
                  placeholder="Nome da categoria..."
                  value={newCategory.label}
                  onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  className="flex-1"
                />
                <Button onClick={addCategory} disabled={!newCategory.label.trim()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={resetToDefault}>
              Restaurar Padrão
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveChanges}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};