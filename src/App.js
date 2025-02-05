import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState('schema'); // 'schema' or 'visualization'
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [schema, setSchema] = useState(null);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      const response = await fetch('http://localhost:5000/get-schema');
      const data = await response.json();
      if (response.ok) {
        setSchema(data.schema);
      } else {
        setError(data.error || 'Failed to load schema.');
      }
    } catch (err) {
      setError('Failed to connect to backend.');
    }
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const handleRunQuery = async () => {
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/execute-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      if (response.ok) {
        if (data.updatedSchema) {
          setSchema(data.updatedSchema); // Update schema dynamically
        }
        if (data.latestData) {
          setResult(data.latestData);
        } else if (Array.isArray(data.results)) {
          setResult(data.results);
        } else {
          setResult({ message: data.message || 'Query executed successfully' });
        }
      } else {
        setError(data.error || 'Query execution failed.');
      }
    } catch (err) {
      setError('Failed to connect to backend.');
    }
  };

  return (
    <div className="App">
      <div className="split-screen">
        <div className="left-pane">
          <h2>Enter SQL Query</h2>
          <textarea
            value={query}
            onChange={handleQueryChange}
            placeholder="Enter your SQL query here..."
            rows="10"
            cols="50"
          />
          <button className="run-button" onClick={handleRunQuery}>Run</button>
          {error && <p className="error">{error}</p>}
        </div>
        <div className="right-pane">
          <div className="view-buttons">
            <button onClick={() => handleViewChange('schema')}>Schema</button>
            <button onClick={() => handleViewChange('visualization')}>Visualization</button>
          </div>
          <div className="view-content">
            {view === 'schema' ? (
              <div>
                <h3>Database Schema</h3>
                {schema ? (
                  Object.entries(schema).map(([tableName, columns]) => (
                    <div key={tableName} className="table-schema">
                      <h4>{tableName}</h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Column</th>
                            <th>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {columns.map((col, index) => (
                            <tr key={index}>
                              <td>{col.column}</td>
                              <td>{col.type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                ) : (
                  <p>Loading schema...</p>
                )}
              </div>
            ) : (
              <div>
                <h3>Visualization</h3>
                <p>Visualization will be displayed here.</p>
              </div>
            )}
            {result && (
              <div className="query-result">
                <h3>Query Result</h3>
                {Array.isArray(result) ? (
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(result[0] || {}).map((col, index) => (
                          <th key={index}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.values(row).map((value, colIndex) => (
                            <td key={colIndex}>{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>{result.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
