import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, TrendingUp, Trash2, Car as CarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useInvestmentGroups } from '@/hooks/useInvestmentGroups';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useCars } from '@/hooks/useCarBusiness';
import { CarFormDialog } from '@/components/cars/CarFormDialog';
import { inr } from '@/lib/carBusiness';

const SharedInvestments: React.FC = () => {
  const { groups, loading, createGroup, deleteGroup } = useInvestmentGroups();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { cars, summaries, loading: carsLoading, createCar, deleteCar } = useCars();
  const [carOpen, setCarOpen] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const result = await createGroup(name.trim(), description.trim());
    if (result) {
      setName('');
      setDescription('');
      setOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shared Investments</h1>
          <p className="text-muted-foreground">Manage your investment groups with friends</p>
        </div>
        <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setCarOpen(true)}><CarIcon className="w-4 h-4 mr-2" /> Add Car</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Group</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Investment Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button onClick={handleCreate} className="w-full" disabled={!name.trim()}>Create Group</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <CarFormDialog
        open={carOpen}
        onOpenChange={setCarOpen}
        onSubmit={async (data) => {
          const car = await createCar(data);
          if (car) navigate(`/investments/cars/${car.id}`);
        }}
      />

      {/* Cars */}
      {!carsLoading && cars.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><CarIcon className="w-5 h-5 text-primary" /> Cars</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cars.map((car, i) => {
              const sum = summaries[car.id] ?? { earned: 0, spent: 0 };
              const profit = sum.earned - sum.spent;
              return (
                <motion.div key={car.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(`/investments/cars/${car.id}`)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CarIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{car.name}</CardTitle>
                            <CardDescription>{[car.reg_number, car.partners.join(' & ')].filter(Boolean).join(' · ')}</CardDescription>
                          </div>
                        </div>
                        {user?.id === car.created_by && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete car?</AlertDialogTitle>
                                <AlertDialogDescription>This permanently deletes the car with all its trips and expenses.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteCar(car.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><p className="text-xs text-muted-foreground">Earned</p><p className="font-semibold text-emerald-500">{inr(sum.earned)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Spent</p><p className="font-semibold text-rose-500">{inr(sum.spent)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Profit</p><p className={`font-semibold ${profit >= 0 ? 'text-foreground' : 'text-rose-500'}`}>{inr(profit)}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 pt-2"><Users className="w-5 h-5 text-primary" /> Groups</h2>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : groups.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No investment groups yet</h3>
            <p className="text-muted-foreground mb-4">Create your first group to start tracking shared investments</p>
            <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create Group</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, i) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="cursor-pointer hover:shadow-md transition-shadow group relative" onClick={() => navigate(`/investments/${group.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        {group.description && <CardDescription className="line-clamp-2">{group.description}</CardDescription>}
                      </div>
                    </div>
                    {user?.id === group.created_by && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete group?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete the group and all its data.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteGroup(group.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Created {new Date(group.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedInvestments;
