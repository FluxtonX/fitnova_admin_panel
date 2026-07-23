import React, { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Trash,
  Trophy,
  Copy,
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
import ChallengeForm from '../../components/forms/ChallengeForm';
import ChallengeDetailModal from './ChallengeDetailModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import {
  getChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  duplicateChallenge,
  bulkDeleteChallenges,
  bulkUpdateChallengeStatus,
  CATEGORY_IMAGES,
} from '../../services/firebase/challengeService';
import styles from './ChallengesList.module.css';

const CATEGORY_FILTERS = [
  'All',
  'Workouts',
  'Calories',
  'Steps',
  'Weight Loss',
  'Strength',
  'Meditation',
  'Water',
  'Team',
];

const ChallengesList = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // View Mode: 'grid' | 'table'
  const [viewMode, setViewMode] = useState('grid');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Drawer / Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [viewingChallenge, setViewingChallenge] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Confirm Modal State
  const [deletingTarget, setDeletingTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchChallengesData();
  }, []);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchChallengesData = async () => {
    setLoading(true);
    try {
      const data = await getChallenges();
      setChallenges(data || []);
    } catch (err) {
      console.warn('Failed to fetch from Firestore:', err);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const processedChallenges = useMemo(() => {
    let list = [...challenges];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q) ||
          (c.type || '').toLowerCase().includes(q)
      );
    }

    // Category filter
    if (activeCategory !== 'All') {
      const catKeyMap = {
        Workouts: 'complete_workouts',
        Calories: 'burn_calories',
        Steps: 'build_streak',
        'Weight Loss': 'weight_loss',
        Strength: 'strength_goal',
        Meditation: 'meditation_goal',
        Water: 'water',
        Team: 'team_challenge',
      };
      const targetType = catKeyMap[activeCategory];
      if (targetType) {
        list = list.filter((c) => (c.type || c.category) === targetType);
      }
    }

    // Status filter
    if (statusFilter !== 'All') {
      list = list.filter((c) => (c.status || 'active').toLowerCase() === statusFilter.toLowerCase());
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'name-asc') return a.title.localeCompare(b.title);
      if (sortBy === 'points') return (b.rewardPoints || 0) - (a.rewardPoints || 0);
      if (sortBy === 'participants') return (b.participantCount || 0) - (a.participantCount || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return list;
  }, [challenges, searchTerm, activeCategory, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedChallenges.length / pageSize) || 1;
  const paginatedChallenges = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedChallenges.slice(start, start + pageSize);
  }, [processedChallenges, currentPage]);

  // Submit Create / Edit Form
  const handleFormSubmit = async (formData) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editingChallenge) {
        // Update
        try {
          await updateChallenge(editingChallenge.id, formData);
        } catch (_) {}
        setChallenges((prev) =>
          prev.map((c) => (c.id === editingChallenge.id ? { ...c, ...formData } : c))
        );
        showToast(`Challenge "${formData.title}" updated!`);
      } else {
        // Create
        let newId = `challenge_${Date.now()}`;
        try {
          newId = await createChallenge(formData);
        } catch (_) {}
        const newObj = { id: newId, ...formData, createdAt: new Date().toISOString() };
        setChallenges((prev) => [newObj, ...prev]);
        showToast(`Challenge "${formData.title}" created successfully!`);
      }
      setIsDrawerOpen(false);
      setEditingChallenge(null);
    } catch (err) {
      setFormError(err.message || 'Failed to save challenge.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Confirm
  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    setDeleteLoading(true);
    try {
      if (deletingTarget === 'bulk') {
        await bulkDeleteChallenges(selectedIds);
        setChallenges((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
        showToast(`${selectedIds.length} challenges deleted.`);
        setSelectedIds([]);
      } else {
        await deleteChallenge(deletingTarget);
        const targetId = deletingTarget.id || deletingTarget.challengeId;
        const targetTitle = deletingTarget.title;
        setChallenges((prev) =>
          prev.filter(
            (c) =>
              c.id !== targetId &&
              c.challengeId !== targetId &&
              c.title?.trim() !== targetTitle?.trim()
          )
        );
        showToast(`Challenge "${deletingTarget.title || 'selected'}" deleted.`);
      }
      setDeletingTarget(null);
    } catch (err) {
      console.error('Delete challenge error:', err);
      showToast(err.message || 'Failed to delete challenge.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Duplicate
  const handleDuplicate = async (challenge) => {
    try {
      let copyId = `challenge_copy_${Date.now()}`;
      try {
        copyId = await duplicateChallenge(challenge.id);
      } catch (_) {}
      const copyObj = {
        ...challenge,
        id: copyId,
        title: `${challenge.title} (Copy)`,
        createdAt: new Date().toISOString(),
      };
      setChallenges((prev) => [copyObj, ...prev]);
      showToast(`Duplicated "${challenge.title}"!`);
    } catch (err) {
      showToast(err.message || 'Failed to duplicate.', 'error');
    }
  };

  // Bulk Status Update
  const handleBulkStatus = async (newStatus) => {
    if (selectedIds.length === 0) return;
    try {
      try {
        await bulkUpdateChallengeStatus(selectedIds, newStatus);
      } catch (_) {}
      setChallenges((prev) =>
        prev.map((c) => (selectedIds.includes(c.id) ? { ...c, status: newStatus } : c))
      );
      showToast(`Updated status to ${newStatus} for ${selectedIds.length} challenges.`);
      setSelectedIds([]);
    } catch (err) {
      showToast(err.message || 'Bulk status update failed.', 'error');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedChallenges.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedChallenges.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
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

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Community Challenges</h2>
          <p>Create, manage, and monitor live challenges for the Fitnova app.</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <MagnifyingGlass size={20} weight="duotone" className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search challenges..."
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
              setEditingChallenge(null);
              setFormError(null);
              setIsDrawerOpen(true);
            }}
          >
            <Plus size={18} weight="bold" /> Create Challenge
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className={styles.filterChips}>
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            className={`${styles.chip} ${activeCategory === cat ? styles.active : ''}`}
            onClick={() => {
              setActiveCategory(cat);
              setCurrentPage(1);
            }}
          >
            {cat === 'All' ? `All • ${challenges.length}` : cat}
          </button>
        ))}
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.selectFilters}>
          <div className={styles.filterGroup}>
            <SlidersHorizontal size={16} />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.miniSelect}
            >
              <option value="All">Status: All</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
              <option value="draft">Draft</option>
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
            <option value="name-asc">Title (A-Z)</option>
            <option value="points">Highest Reward Points</option>
            <option value="participants">Most Participants</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span>{selectedIds.length} items selected</span>
          <div className={styles.bulkActions}>
            <button className={styles.bulkBtn} onClick={() => handleBulkStatus('active')}>
              Set Active
            </button>
            <button className={styles.bulkBtn} onClick={() => handleBulkStatus('ended')}>
              Set Ended
            </button>
            <button className={`${styles.bulkBtn} ${styles.danger}`} onClick={() => setDeletingTarget('bulk')}>
              <Trash size={16} /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : processedChallenges.length === 0 ? (
        <div className={styles.emptyState}>
          <Trophy size={48} weight="duotone" className={styles.emptyIcon} />
          <h3>No challenges found</h3>
          <p>No challenge matches your search or filter settings.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className={styles.grid}>
          {paginatedChallenges.map((c) => {
            const isSelected = selectedIds.includes(c.id);
            const categoryKey = c.type || c.category || 'complete_workouts';
            const coverImage =
              c.imageUrl ||
              c.bannerUrl ||
              CATEGORY_IMAGES[categoryKey] ||
              CATEGORY_IMAGES.complete_workouts;

            return (
              <div
                key={c.id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => setViewingChallenge(c)}
              >
                {/* Image Cover Banner Header */}
                <div
                  className={styles.cardImageBanner}
                  style={{ backgroundImage: `url(${coverImage})` }}
                >
                  <div className={styles.cardImageOverlay} />

                  <div className={styles.cardTopRow}>
                    <div className={styles.cardTopLeft}>
                      <button
                        type="button"
                        className={styles.checkboxBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(c.id);
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare size={20} weight="fill" color="#2563eb" />
                        ) : (
                          <Square size={20} color="#ffffff" />
                        )}
                      </button>
                      <span className={styles.cardCategoryBadge}>
                        {(c.type || 'WORKOUTS').replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <span
                      className={`${styles.cardStatusPill} ${
                        styles[(c.status || 'active').toLowerCase()]
                      }`}
                    >
                      {c.status || 'active'}
                    </span>
                  </div>

                  <div className={styles.cardHeaderBottom}>
                    <h3 className={styles.cardTitle}>{c.title}</h3>
                    {c.isFeatured && <Star size={18} weight="fill" color="#fbbf24" />}
                  </div>
                </div>

                {/* Card Body */}
                <div className={styles.cardBody}>
                  <p className={styles.descriptionText}>{c.description || c.goal}</p>

                  <div className={styles.cardMetricsRow}>
                    <div className={styles.metricCol}>
                      <span className={styles.metricLabel}>Goal / Duration</span>
                      <span className={styles.metricValue}>
                        {c.targetValue || 10} {c.unit || 'units'} ({c.durationDays || 7}d)
                      </span>
                    </div>

                    <div className={styles.metricCol} style={{ alignItems: 'flex-end' }}>
                      <span className={styles.metricLabel}>Reward</span>
                      <span className={styles.rewardPoints}>+{c.rewardPoints || 500} pts</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className={styles.cardFooter}>
                  <span className={styles.clickHint}>Click to view & manage details</span>

                  <div className={styles.cardActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(c);
                      }}
                      title="Duplicate Challenge"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingChallenge(c);
                        setFormError(null);
                        setIsDrawerOpen(true);
                      }}
                      title="Edit Challenge"
                    >
                      <PencilSimple size={18} />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.danger}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingTarget(c);
                      }}
                      title="Delete Challenge"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div
            className={styles.addCard}
            onClick={() => {
              setEditingChallenge(null);
              setFormError(null);
              setIsDrawerOpen(true);
            }}
          >
            <div className={styles.addIconBox}>
              <Plus size={24} weight="bold" />
            </div>
            <span className={styles.addText}>Create new challenge</span>
          </div>
        </div>
      ) : (
        /* Table View */
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <button className={styles.checkboxBtn} onClick={handleSelectAll}>
                    {selectedIds.length === paginatedChallenges.length && paginatedChallenges.length > 0 ? (
                      <CheckSquare size={20} weight="fill" color="#2563eb" />
                    ) : (
                      <Square size={20} color="rgba(0,0,0,0.3)" />
                    )}
                  </button>
                </th>
                <th>Challenge Title</th>
                <th>Category</th>
                <th>Target & Unit</th>
                <th>Duration</th>
                <th>Reward</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedChallenges.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <tr
                    key={c.id}
                    className={isSelected ? styles.rowSelected : ''}
                    onClick={() => setViewingChallenge(c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <button
                        className={styles.checkboxBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(c.id);
                        }}
                      >
                        {isSelected ? <CheckSquare size={20} weight="fill" color="#2563eb" /> : <Square size={20} color="rgba(0,0,0,0.3)" />}
                      </button>
                    </td>
                    <td className={styles.tableNameCell}>
                      <span className={styles.tableName}>{c.title}</span>
                      {c.isFeatured && <Star size={14} weight="fill" color="#fbbf24" />}
                    </td>
                    <td><span className={styles.tableCategory}>{(c.type || 'workouts').replace('_', ' ')}</span></td>
                    <td>{c.targetValue || 10} {c.unit || 'units'}</td>
                    <td>{c.durationDays || 7} Days</td>
                    <td><span className={styles.rewardValue}>+{c.rewardPoints || 500} pts</span></td>
                    <td>
                      <span className={`${styles.cardStatusPill} ${styles[(c.status || 'active').toLowerCase()]}`}>
                        {c.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.tableActions}>
                        <button
                          className={styles.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(c);
                          }}
                          title="Duplicate"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChallenge(c);
                            setIsDrawerOpen(true);
                          }}
                          title="Edit"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.danger}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingTarget(c);
                          }}
                          title="Delete"
                        >
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

      {/* Pagination */}
      {processedChallenges.length > pageSize && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, processedChallenges.length)} of {processedChallenges.length}
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

      {/* Challenge Detail Modal */}
      {viewingChallenge && (
        <ChallengeDetailModal
          challenge={viewingChallenge}
          onClose={() => setViewingChallenge(null)}
          onEdit={(c) => {
            setEditingChallenge(c);
            setFormError(null);
            setIsDrawerOpen(true);
          }}
          onDelete={(c) => {
            setDeletingTarget(c);
          }}
        />
      )}

      {/* SlideOver Drawer for Create / Edit Form */}
      <SlideOver
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingChallenge(null);
        }}
        title={editingChallenge ? `Edit "${editingChallenge.title}"` : 'Create New Challenge'}
      >
        <ChallengeForm
          initialData={editingChallenge}
          isSubmitting={formSubmitting}
          error={formError}
          onCancel={() => {
            setIsDrawerOpen(false);
            setEditingChallenge(null);
          }}
          onSubmit={handleFormSubmit}
        />
      </SlideOver>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingTarget)}
        title={deletingTarget === 'bulk' ? `Delete ${selectedIds.length} Challenges?` : `Delete "${deletingTarget?.title}"?`}
        message="Are you sure you want to delete this challenge? This action cannot be undone."
        confirmText="Yes, Delete"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingTarget(null)}
      />
    </div>
  );
};

export default ChallengesList;
