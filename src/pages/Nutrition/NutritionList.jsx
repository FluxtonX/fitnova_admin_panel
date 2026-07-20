import React, { useState } from 'react';
import { MagnifyingGlass, Plus, PencilSimple, Trash, ForkKnife } from '@phosphor-icons/react';
import SlideOver from '../../components/modals/SlideOver';
import NutritionForm from '../../components/forms/NutritionForm';
import styles from '../../styles/tableLayout.module.css';

const NutritionList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const mockRecipes = [
    { id: 1, name: 'Avocado Toast', calories: 350, protein: '12g', diet: 'Vegan' },
    { id: 2, name: 'Grilled Chicken Salad', calories: 420, protein: '35g', diet: 'Keto' },
    { id: 3, name: 'Protein Smoothie', calories: 280, protein: '25g', diet: 'Vegetarian' },
  ];

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Nutrition & Recipes</h2>
          <p>Manage healthy recipes and meal plans.</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <MagnifyingGlass size={20} weight="duotone" className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search recipes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn primary" onClick={() => setIsDrawerOpen(true)}>
            <Plus size={18} weight="bold" /> Add Recipe
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Recipe Name</th>
              <th>Calories</th>
              <th>Protein</th>
              <th>Diet Type</th>
              <th className={styles.actionsColumn}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockRecipes.map(recipe => (
              <tr key={recipe.id}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar} style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                      <ForkKnife size={20} weight="duotone" />
                    </div>
                    <span className={styles.emailText}>{recipe.name}</span>
                  </div>
                </td>
                <td><span className={styles.dateText}>{recipe.calories}</span></td>
                <td><span className={styles.dateText}>{recipe.macros}</span></td>
                <td><span className={styles.badge}>{recipe.type}</span></td>
                <td className={styles.actionsColumn}>
                  <div className={styles.actions}>
                    <button className={styles.iconBtn} title="Edit"><PencilSimple size={20} weight="duotone" /></button>
                    <button className={styles.iconBtn} title="Delete"><Trash size={20} weight="duotone" className={styles.dangerIcon} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlideOver 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title="Add New Recipe"
      >
        <NutritionForm 
          onCancel={() => setIsDrawerOpen(false)}
          onSubmit={(data) => {
            console.log(data);
            setIsDrawerOpen(false);
          }}
        />
      </SlideOver>
    </div>
  );
};

export default NutritionList;
