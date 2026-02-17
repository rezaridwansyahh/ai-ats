import { useEffect, useState } from "react"
import "./style.css"

/*
  This file divided by several function
  1.  Function to run the scrape at the beginning of code

      The Function will be run the runScrape() when the extension button is clicked or started.

  2.  Function to renderTable

      This function is to generate table based on the data we scraped.
      It can dynamically detect the key and object from list of JSON in an Array,
      It also can using the key-value pairs (single value or object)
      Lastly, it can detect old variable.

  3.  Function to Export to JSON or CSV

      Here, it can output a file either a list of JSON in an Array or CSV.

*/

function Popup() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const runScrape = async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })

      if (!tab?.id) {
        setError("No active tab")
        setLoading(false)
        return
      }

      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: "SCRAPE"
        })

        console.log("Response data:", response.data)
        setResult(response?.data || null)
        setLoading(false)
      } catch (err) {
        setError("Cannot scrape this page" +  err.message)
        setLoading(false)
      }
    }

    runScrape()
  }, [])

  // Function to render JSON data as a table
  const renderTable = (data) => {
    // Case 1: Array of objects (most common)
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <p className="no-data">No data to display</p>
      }

      // Get all unique keys from all objects
      const allKeys = Array.from(
        new Set(data.flatMap((item) => Object.keys(item)))
      )

      return (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {allKeys.map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td className="index-cell">{index + 1}</td>
                    {allKeys.map((key) => (
                      <td key={key}>
                        {renderCell(item[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // Case 2: Single object (key-value pairs)
    if (typeof data === "object" && data !== null) {
      const entries = Object.entries(data)

      if (entries.length === 0) {
        return <p className="no-data">No data to display</p>
      }

      return (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key}>
                  <td className="key-cell">{key}</td>
                  <td>{renderCell(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    // Case 3: Primitive value
    return <p className="primitive-value">{String(data)}</p>
  }

  // Helper function to render cell content
  const renderCell = (value) => {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return <span className="null-value">-</span>
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return (
        <span className="array-value">
          [{value.length} items]
        </span>
      )
    }

    // Handle objects
    if (typeof value === "object") {
      return (
        <span className="object-value">
          {JSON.stringify(value)}
        </span>
      )
    }

    // Handle URLs (make them clickable)
    if (typeof value === "string" && value.match(/^https?:\/\//)) {
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="link-value">
          {value.length > 40 ? value.substring(0, 40) + "..." : value}
        </a>
      )
    }

    // Handle long strings (truncate)
    if (typeof value === "string" && value.length > 100) {
      return (
        <span title={value}>
          {value.substring(0, 100)}...
        </span>
      )
    }

    // Default: convert to string
    return String(value)
  }

  // Export functions
  const exportJSON = () => {
    const dataStr = JSON.stringify(result, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `scraped-data-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    if (!result) return

    let csv = ""

    if (Array.isArray(result)) {
      // Get headers
      const allKeys = Array.from(
        new Set(result.flatMap((item) => Object.keys(item)))
      )
      csv += allKeys.map((key) => `"${key}"`).join(",") + "\n"

      // Add rows
      result.forEach((item) => {
        csv += allKeys
          .map((key) => {
            const value = item[key]
            if (value === null || value === undefined) return '""'
            if (typeof value === "object") return `"${JSON.stringify(value)}"`
            return `"${String(value).replace(/"/g, '""')}"`
          })
          .join(",") + "\n"
      })
    } else if (typeof result === "object") {
      csv = "Key,Value\n"
      Object.entries(result).forEach(([key, value]) => {
        const valueStr =
          typeof value === "object" ? JSON.stringify(value) : String(value)
        csv += `"${key}","${valueStr.replace(/"/g, '""')}"\n`
      })
    }

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `scraped-data-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-[400px] h-[500px] p-4 bg-red-500">
      <h1 className="text-white text-2xl">It works!</h1>
    </div>
  )
}

export default Popup
