async function saveCSV () {
  // (A) ARRAY OF DATA
  var array = [
    ["Job", "job@doe.com", "123456"],
    ["Joe", "joe@doe.com", "234567"],
    ["Joi", "joi@doe.com", "345678"],
    ["Jon", "jon@doe.com", "456789"],
    ["Jou", "jou@doe.com", "987654"],
    ["Joy, Doe", "joy@doe.com", "876543"],
  ];

  // (B) CREATE BLOB OBJECT
  var blob = new Blob([CSV.serialize(array)], {type: "text/csv"});

  // (C) FILE HANDLER & FILE STREAM
  const fileHandle = await window.showSaveFilePicker({
    suggestedName : "demo.csv",
    types: [{
      description: "CSV file",
      accept: {"text/csv": [".csv"]}
    }]
  });
  const fileStream = await fileHandle.createWritable();

  // (D) WRITE CSV FILE
  await fileStream.write(blob);
  await fileStream.close();
}