# @typepurify/react-state

Universal, zero-dependency Data Table logic. Part of the TypePurify ecosystem.

## Installation

```bash
npm install @typepurify/react-table
```

## Usage

### `useTable`

A headless React hook that handles sorting and pagination for arrays of data. You provide the raw data, and it gives you back the slice of data you should render, along with control functions.

```tsx
import { useTable } from '@typepurify/react-table';

interface User {
  id: number;
  name: string;
  age: number;
}

const MOCK_DATA: User[] = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 },
];

export function UserTable() {
  const { data, handleSort, sortKey, sortDirection, currentPage, totalPages, setCurrentPage } =
    useTable({
      data: MOCK_DATA,
      columns: [
        { key: 'name', title: 'Name' },
        { key: 'age', title: 'Age' },
      ],
      initialPageSize: 2,
    });

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>
              Name {sortKey === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => handleSort('age')}>
              Age {sortKey === 'age' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.age}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
```
