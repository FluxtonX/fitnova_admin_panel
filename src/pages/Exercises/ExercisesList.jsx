import React, { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Trash,
  Barbell,
  Copy,
  Eye,
  SquaresFour,
  Table as TableIcon,
  CheckSquare,
  Square,
  SlidersHorizontal,
  CheckCircle,
  WarningCircle,
  CaretLeft,
  CaretRight,
  Star,
} from '@phosphor-icons/react';
import SlideOver from '../../components/modals/SlideOver';
import ExerciseForm from '../../components/forms/ExerciseForm';
import ConfirmModal from '../../components/modals/ConfirmModal';
import ExerciseDetailsModal from '../../components/modals/ExerciseDetailsModal';
import {
  getExercises,
  createExercise,
  updateExercise,
  deleteExercise,
  duplicateExercise,
  bulkDeleteExercises,
  bulkUpdateStatus,
  syncCloudinaryPresetExercises,
} from '../../services/firebase/exerciseService';
import styles from './ExercisesList.module.css';

const CATEGORY_FILTERS = ['All', 'Legs', 'Chest', 'Back', 'Arms', 'Shoulders', 'Core', 'Full Body', 'Flexibility', 'Cardio'];
const DIFFICULTY_OPTIONS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const EQUIPMENT_OPTIONS = ['All', 'None', 'Dumbbells', 'Barbell', 'Kettlebell', 'Resistance Band', 'Machine', 'Cable', 'Mat'];
const STATUS_OPTIONS = ['All', 'Active', 'Draft', 'Inactive'];

const ExercisesList = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text: '' }

  // View Mode: 'grid' | 'table'
  const [viewMode, setViewMode] = useState('grid');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [equipmentFilter, setEquipmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'name-asc' | 'name-desc' | 'calories'

  // Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Drawer / Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Details Modal State
  const [inspectingExercise, setInspectingExercise] = useState(null);

  // Delete Confirm Modal State
  const [deletingTarget, setDeletingTarget] = useState(null); // single exercise or 'bulk'
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch Exercises from Firestore on mount
  useEffect(() => {
    fetchExercisesData();
  }, []);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchExercisesData = async () => {
    setLoading(true);
    try {
      let data = await getExercises();
      if (!data || data.length === 0) {
        showToast('Syncing Cloudinary exercise videos to Firestore...', 'info');
        const count = await syncCloudinaryPresetExercises();
        showToast(`Successfully synced ${count} Cloudinary exercises to Firestore!`, 'success');
        data = await getExercises();
      }
      setExercises(data || []);
    } catch (err) {
      console.warn('Failed to fetch from Firestore:', err);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const processedExercises = useMemo(() => {
    let list = [...exercises];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          (ex.primaryMuscle || '').toLowerCase().includes(q) ||
          (ex.equipment || '').toLowerCase().includes(q)
      );
    }

    // Category filter
    if (activeCategory !== 'All') {
      list = list.filter((ex) => (ex.category || ex.muscleGroup) === activeCategory);
    }

    // Difficulty filter
    if (difficultyFilter !== 'All') {
      list = list.filter((ex) => ex.difficulty === difficultyFilter);
    }

    // Equipment filter
    if (equipmentFilter !== 'All') {
      list = list.filter((ex) => ex.equipment === equipmentFilter);
    }

    // Status filter
    if (statusFilter !== 'All') {
      list = list.filter((ex) => (ex.status || 'Active') === statusFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'calories') return (b.calories || 0) - (a.calories || 0);
      // default: newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return list;
  }, [exercises, searchTerm, activeCategory, difficultyFilter, equipmentFilter, statusFilter, sortBy]);

  // Paginated exercises
  const totalPages = Math.ceil(processedExercises.length / pageSize) || 1;
  const paginatedExercises = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedExercises.slice(start, start + pageSize);
  }, [processedExercises, currentPage]);

  // Handle Form Submit (Create / Edit)
  const handleFormSubmit = async (formData) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editingExercise) {
        // Update
        if (!editingExercise.id.toString().startsWith('mock-')) {
          await updateExercise(editingExercise.id, formData);
        }
        setExercises((prev) =>
          prev.map((ex) => (ex.id === editingExercise.id ? { ...ex, ...formData, id: editingExercise.id } : ex))
        );
        showToast(`Exercise "${formData.name}" updated successfully!`);
      } else {
        // Create
        let newId = `ex-${Date.now()}`;
        try {
          newId = await createExercise(formData);
        } catch (dbErr) {
          console.warn('Saved locally (mock mode):', dbErr.message);
        }

        const newExercise = { id: newId, ...formData, createdAt: new Date().toISOString() };
        setExercises((prev) => [newExercise, ...prev]);
        showToast(`Exercise "${formData.name}" created successfully!`);
      }

      setIsDrawerOpen(false);
      setEditingExercise(null);
    } catch (err) {
      setFormError(err.message || 'Failed to save exercise.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Single Delete
  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    setDeleteLoading(true);
    try {
      if (deletingTarget === 'bulk') {
        // Bulk delete
        const toDelete = exercises.filter((ex) => selectedIds.includes(ex.id));
        try {
          await bulkDeleteExercises(toDelete);
        } catch (_) {}

        setExercises((prev) => prev.filter((ex) => !selectedIds.includes(ex.id)));
        showToast(`${selectedIds.length} exercises deleted successfully!`);
        setSelectedIds([]);
      } else {
        // Single delete
        const target = deletingTarget;
        if (!target.id.toString().startsWith('mock-')) {
          await deleteExercise(target.id, target);
        }
        setExercises((prev) => prev.filter((ex) => ex.id !== target.id));
        showToast(`Exercise "${target.name}" deleted.`);
      }

      setDeletingTarget(null);
      if (inspectingExercise) setInspectingExercise(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete exercise.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Duplicate
  const handleDuplicate = async (ex) => {
    try {
      let copyId = `mock-copy-${Date.now()}`;
      if (!ex.id.toString().startsWith('mock-')) {
        copyId = await duplicateExercise(ex.id);
      }

      const duplicateObj = {
        ...ex,
        id: copyId,
        name: `${ex.name} (Copy)`,
        createdAt: new Date().toISOString(),
      };

      setExercises((prev) => [duplicateObj, ...prev]);
      showToast(`Duplicated "${ex.name}"!`);
    } catch (err) {
      showToast(err.message || 'Failed to duplicate exercise.', 'error');
    }
  };

  // Bulk Status Update
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedIds.length === 0) return;
    try {
      try {
        await bulkUpdateStatus(selectedIds, newStatus);
      } catch (_) {}

      setExercises((prev) =>
        prev.map((ex) => (selectedIds.includes(ex.id) ? { ...ex, status: newStatus } : ex))
      );
      showToast(`Updated status to "${newStatus}" for ${selectedIds.length} exercises.`);
      setSelectedIds([]);
    } catch (err) {
      showToast(err.message || 'Bulk update failed.', 'error');
    }
  };

  // Select All Toggle
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedExercises.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedExercises.map((ex) => ex.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className={`${styles.container} animate-fade-in`}>

      {/* Toast Notification Banner */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.type === 'success' ? <CheckCircle size={20} weight="fill" /> : <WarningCircle size={20} weight="fill" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Exercises Library</h2>
          <p>Manage exercise library, media assets, and workout elements.</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <MagnifyingGlass size={20} weight="duotone" className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.activeView : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <SquaresFour size={18} weight="bold" />
            </button>

            <button
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.activeView : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon size={18} weight="bold" />
            </button>
          </div>

          <button
            className="btn primary"
            onClick={() => {
              setEditingExercise(null);
              setFormError(null);
              setIsDrawerOpen(true);
            }}
          >
            <Plus size={18} weight="bold" /> Add Exercise
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className={styles.filterChips}>
        <button
          className={`${styles.chip} ${activeCategory === 'All' ? styles.active : ''}`}
          onClick={() => {
            setActiveCategory('All');
            setCurrentPage(1);
          }}
        >
          All • {exercises.length}
        </button>
        {CATEGORY_FILTERS.slice(1).map((filter) => (
          <button
            key={filter}
            className={`${styles.chip} ${activeCategory === filter ? styles.active : ''}`}
            onClick={() => {
              setActiveCategory(filter);
              setCurrentPage(1);
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Secondary Filter & Sort Controls */}
      <div className={styles.controlsBar}>
        <div className={styles.selectFilters}>
          <div className={styles.filterGroup}>
            <SlidersHorizontal size={16} />
            <select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.miniSelect}
            >
              <option value="All">Difficulty: All</option>
              {DIFFICULTY_OPTIONS.slice(1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              value={equipmentFilter}
              onChange={(e) => {
                setEquipmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.miniSelect}
            >
              <option value="All">Equipment: All</option>
              {EQUIPMENT_OPTIONS.slice(1).map((eq) => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.miniSelect}
            >
              <option value="All">Status: All</option>
              {STATUS_OPTIONS.slice(1).map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.sortGroup}>
          <span className={styles.sortLabel}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.miniSelect}
          >
            <option value="newest">Newest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="calories">Highest Calories</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Selection Toolbar */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span>{selectedIds.length} items selected</span>
          <div className={styles.bulkActions}>
            <button className={styles.bulkBtn} onClick={() => handleBulkStatusChange('Active')}>
              Set Active
            </button>
            <button className={styles.bulkBtn} onClick={() => handleBulkStatusChange('Draft')}>
              Set Draft
            </button>
            <button className={`${styles.bulkBtn} ${styles.danger}`} onClick={() => setDeletingTarget('bulk')}>
              <Trash size={16} /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : processedExercises.length === 0 ? (
        /* Empty State */
        <div className={styles.emptyState}>
          <Barbell size={48} weight="duotone" className={styles.emptyIcon} />
          <h3>No exercises found</h3>
          <p>No exercise matches your current search or filter criteria.</p>
          <button
            className="btn primary"
            onClick={() => {
              setSearchTerm('');
              setActiveCategory('All');
              setDifficultyFilter('All');
              setEquipmentFilter('All');
              setStatusFilter('All');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (

        /* ── GRID CARD VIEW (Matching Figma/Screenshot) ── */
        <div className={styles.grid}>
          {paginatedExercises.map((ex) => {
            const categoryName = ex.category || ex.muscleGroup || 'Full Body';
            const isSelected = selectedIds.includes(ex.id);
            return (
              <div
                key={ex.id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                data-muscle={categoryName}
                data-difficulty={ex.difficulty}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <button
                      type="button"
                      className={styles.checkboxBtn}
                      onClick={() => handleToggleSelect(ex.id)}
                    >
                      {isSelected ? <CheckSquare size={20} weight="fill" color="#8b5cf6" /> : <Square size={20} color="rgba(255,255,255,0.3)" />}
                    </button>
                    <div className={styles.cardIcon}>
                      <Barbell size={24} weight="duotone" />
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => setInspectingExercise(ex)}
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleDuplicate(ex)}
                      title="Duplicate"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => {
                        setEditingExercise(ex);
                        setFormError(null);
                        setIsDrawerOpen(true);
                      }}
                      title="Edit"
                    >
                      <PencilSimple size={18} />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.danger}`}
                      onClick={() => setDeletingTarget(ex)}
                      title="Delete"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>

                <div className={styles.cardMainInfo} onClick={() => setInspectingExercise(ex)}>
                  <div className={styles.titleRow}>
                    <h3 className={styles.cardTitle}>{ex.name}</h3>
                    {ex.featured && <Star size={16} weight="fill" color="#fbbf24" title="Featured" />}
                  </div>

                  <div className={styles.badgeRow}>
                    <span className={styles.badge}>• {categoryName.toUpperCase()}</span>
                    {ex.status && ex.status !== 'Active' && (
                      <span className={`${styles.statusPill} ${styles[ex.status.toLowerCase()]}`}>{ex.status}</span>
                    )}
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.cardFooter}>
                  <div className={styles.footerCol}>
                    <span className={styles.footerLabel}>EQUIPMENT</span>
                    <span className={styles.footerValue}>{ex.equipment || 'None'}</span>
                  </div>

                  <div className={styles.footerCol} style={{ alignItems: 'flex-end' }}>
                    <span className={styles.footerLabel}>{(ex.difficulty || 'Intermediate').toUpperCase()}</span>
                    <div className={styles.difficultyBars}>
                      <div className={styles.difficultyBar}></div>
                      <div className={styles.difficultyBar}></div>
                      <div className={styles.difficultyBar}></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Exercise Card */}
          <div
            className={styles.addCard}
            onClick={() => {
              setEditingExercise(null);
              setFormError(null);
              setIsDrawerOpen(true);
            }}
          >
            <div className={styles.addIconBox}>
              <Plus size={24} weight="bold" />
            </div>
            <span className={styles.addText}>Add new exercise</span>
          </div>
        </div>
      ) : (

        /* ── TABLE VIEW ── */
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <button className={styles.checkboxBtn} onClick={handleSelectAll}>
                    {selectedIds.length === paginatedExercises.length && paginatedExercises.length > 0 ? (
                      <CheckSquare size={20} weight="fill" color="#8b5cf6" />
                    ) : (
                      <Square size={20} color="rgba(255,255,255,0.3)" />
                    )}
                  </button>
                </th>
                <th>Exercise</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Equipment</th>
                <th>Sets / Reps</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedExercises.map((ex) => {
                const isSelected = selectedIds.includes(ex.id);
                return (
                  <tr key={ex.id} className={isSelected ? styles.rowSelected : ''}>
                    <td>
                      <button className={styles.checkboxBtn} onClick={() => handleToggleSelect(ex.id)}>
                        {isSelected ? <CheckSquare size={20} weight="fill" color="#8b5cf6" /> : <Square size={20} color="rgba(255,255,255,0.3)" />}
                      </button>
                    </td>
                    <td className={styles.tableNameCell} onClick={() => setInspectingExercise(ex)}>
                      <span className={styles.tableName}>{ex.name}</span>
                      {ex.featured && <Star size={14} weight="fill" color="#fbbf24" />}
                    </td>
                    <td><span className={styles.tableCategory}>{ex.category || ex.muscleGroup || 'Full Body'}</span></td>
                    <td><span className={styles.tableDifficulty}>{ex.difficulty || 'Beginner'}</span></td>
                    <td>{ex.equipment || 'None'}</td>
                    <td>{ex.sets || 3} × {ex.reps || 10}</td>
                    <td>
                      <span className={`${styles.statusPill} ${styles[(ex.status || 'Active').toLowerCase()]}`}>
                        {ex.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.tableActions}>
                        <button className={styles.actionBtn} onClick={() => setInspectingExercise(ex)} title="Inspect">
                          <Eye size={16} />
                        </button>
                        <button className={styles.actionBtn} onClick={() => handleDuplicate(ex)} title="Duplicate">
                          <Copy size={16} />
                        </button>
                        <button className={styles.actionBtn} onClick={() => { setEditingExercise(ex); setIsDrawerOpen(true); }} title="Edit">
                          <PencilSimple size={16} />
                        </button>
                        <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => setDeletingTarget(ex)} title="Delete">
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {processedExercises.length > pageSize && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, processedExercises.length)} of {processedExercises.length}
          </span>

          <div className={styles.pageBtns}>
            <button
              className={styles.pageBtn}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <CaretLeft size={16} /> Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                className={`${styles.pageNumber} ${num === currentPage ? styles.activePage : ''}`}
                onClick={() => setCurrentPage(num)}
              >
                {num}
              </button>
            ))}

            <button
              className={styles.pageBtn}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <CaretRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* SlideOver Drawer for Create / Edit Form */}
      <SlideOver
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingExercise(null);
        }}
        title={editingExercise ? `Edit "${editingExercise.name}"` : 'Add New Exercise'}
      >
        <ExerciseForm
          initialData={editingExercise}
          isSubmitting={formSubmitting}
          error={formError}
          onCancel={() => {
            setIsDrawerOpen(false);
            setEditingExercise(null);
          }}
          onSubmit={handleFormSubmit}
        />
      </SlideOver>

      {/* Exercise Details Inspect Modal */}
      <ExerciseDetailsModal
        isOpen={Boolean(inspectingExercise)}
        exercise={inspectingExercise}
        onClose={() => setInspectingExercise(null)}
        onEdit={(ex) => {
          setInspectingExercise(null);
          setEditingExercise(ex);
          setIsDrawerOpen(true);
        }}
        onDuplicate={(ex) => {
          handleDuplicate(ex);
          setInspectingExercise(null);
        }}
        onDelete={(ex) => {
          setDeletingTarget(ex);
        }}
      />

      {/* Single / Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingTarget)}
        title={deletingTarget === 'bulk' ? `Delete ${selectedIds.length} Exercises?` : `Delete "${deletingTarget?.name}"?`}
        message={
          deletingTarget === 'bulk'
            ? `Are you sure you want to delete these ${selectedIds.length} selected exercises and their Cloudinary media? This action cannot be undone.`
            : `Are you sure you want to delete "${deletingTarget?.name}" and remove its Cloudinary media assets? This action cannot be undone.`
        }
        confirmText="Yes, Delete"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingTarget(null)}
      />
    </div>
  );
};

export default ExercisesList;
