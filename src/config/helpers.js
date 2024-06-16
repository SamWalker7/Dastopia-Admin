import Papa from 'papaparse';
import Pica from 'pica';

export const filterByDateRange = (data, daysAgo) => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - daysAgo);
  return data?.filter(item => new Date(item.createdAt) >= pastDate).length;
};

export const getPercentageChangeLast7Days = (data) => {
  // Get the number of items created in the last 7 days
  const last7DaysCount = filterByDateRange(data, 7);

  // Get the number of items created in the 7 days before the last 7 days
  const last14DaysCount = filterByDateRange(data, 14);
  const previous7DaysCount = last14DaysCount - last7DaysCount;
  // Calculate the percentage change
  if (previous7DaysCount === 0) {
    // Avoid division by zero
    return last7DaysCount === 0 ? 0 : 100; // If previous7DaysCount is 0 and last7DaysCount is not, the change is considered 100%
  } else {
    return ((last7DaysCount - previous7DaysCount) / previous7DaysCount) * 100;
  }
};

export const getPercentageChangeLast30Days = (data) => {
  // Get the number of items created in the last 7 days
  const last30DaysCount = filterByDateRange(data, 30);

  // Get the number of items created in the 7 days before the last 7 days
  const last60DaysCount = filterByDateRange(data, 60);
  const previous30DaysCount = last60DaysCount - last30DaysCount;
  // Calculate the percentage change
  if (previous30DaysCount === 0) {
    // Avoid division by zero
    return last30DaysCount === 0 ? 0 : 100; // If previous7DaysCount is 0 and last7DaysCount is not, the change is considered 100%
  } else {
    return ((last30DaysCount - previous30DaysCount) / previous30DaysCount) * 100;
  }
};

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

export const resizeImage = (file) => {
  const pica = Pica();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set the dimensions you want after resizing:
        const maxWidth = 800; // example width
        const maxHeight = 800; // example height
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Use Pica to resize the image
        await pica.resize(img, canvas, {
          unsharpAmount: 80,
          unsharpRadius: 0.6,
          unsharpThreshold: 2
        });

        const blob = await pica.toBlob(canvas, 'image/jpeg', 0.90); // Adjust quality as needed
        console.log('blob size', (blob.size / 1024 / 1024).toFixed(2));
        resolve(new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        }));
      };
      img.src = reader.result;
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export const formatCamelCaseToReadableWords = (key) => {
  // Add space before each capital letter and capitalize the first letter of the key
  const result = key.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
};
