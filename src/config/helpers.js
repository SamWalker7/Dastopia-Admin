import Papa from 'papaparse';

export const handleImport = (e) => {
    // setIsFileUploading(true);
    const file = e.target.files[0]; // Get the file from the input element
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;

      Papa.parse(csvData, {
        header: true, // Consider the first row of the CSV as headers
        dynamicTyping: true, // Automatically convert numbers and booleans
        skipEmptyLines: true, // Skip empty lines
        complete: function (results) {
          // console.log("Parsed data:", results.data);
          const jsonData = results.data;
          console.log('result: ', results.data);
          let errors = [];
          const makes = new Set();
          let carMap = new Map();
          try {
            for (const car of jsonData) {
              makes.add(car['Make']);
              if (!carMap.has(car.Make)) {
                carMap.set(car.Make, new Set());
              }
              carMap.get(car.Make).add(car.Model);
            }
          } catch (err) {
            errors.push(err);
          }
          console.log('makes: ', Array.from(makes));
          console.log('make & model: ', Array.from(carMap));
          let arrayOfCars = Array.from(carMap).map(([make, models]) => {
            // Create an object with the make as the key and the models array as the value
            return { [make]: Array.from(models) };
        });
        //   setIsFileUploading(false)
        //   downloadJSON(arrayOfCars, "output.json"); // Function to trigger JSON file download
        },
        error: function (error) {
        //   setIsFileUploading(false)
          console.error("Error parsing CSV:", error);
        }
      });
    };

    reader.onerror = (error) => console.error('Error reading CSV file:', error);
    reader.readAsText(file); // Read the file as a text file
  }

  export const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up the URL object
  }