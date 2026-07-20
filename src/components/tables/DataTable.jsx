import React from 'react';
import { MdEdit, MdDelete, MdSearch } from 'react-icons/md';
import Button from '../buttons/Button';
import styles from './DataTable.module.css';

const DataTable = ({ 
  title, 
  data, 
  columns, 
  isLoading, 
  onAdd, 
  onEdit, 
  onDelete, 
  searchTerm, 
  onSearchChange,
  addLabel = "Add New"
}) => {

  const renderCell = (item, col) => {
    if (col.render) {
      return col.render(item[col.key], item);
    }
    return item[col.key];
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{title}</h2>
        <div className={styles.actions}>
          <div className={styles.searchBox}>
            <MdSearch className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button onClick={onAdd} className={styles.addBtn}>{addLabel}</Button>
        </div>
      </div>

      <div className={`glass ${styles.tableWrapper} animate-slide-up`}>
        {isLoading ? (
          <div className={styles.emptyState}>Loading data...</div>
        ) : !data || data.length === 0 ? (
          <div className={styles.emptyState}>No {title.toLowerCase()} found.</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.key} style={{ width: col.width }}>{col.label}</th>
                  ))}
                  <th className={styles.actionsCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.id || index}>
                    {columns.map(col => (
                      <td key={`${item.id || index}-${col.key}`}>
                        {renderCell(item, col)}
                      </td>
                    ))}
                    <td className={styles.actionsCol}>
                      <div className={styles.rowActions}>
                        {onEdit && (
                          <button 
                            className={styles.iconBtn} 
                            onClick={() => onEdit(item)}
                            title="Edit"
                          >
                            <MdEdit />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            className={`${styles.iconBtn} ${styles.danger}`} 
                            onClick={() => onDelete(item.id)}
                            title="Delete"
                          >
                            <MdDelete />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
