function createMarkdownResult(markdownText)
{
    $("#markdownResult").html('');
    $("#markdownResult").html(marked(markdownText));
    $("#markdownResult").width($("#markdownResult table").width());
}

var arrParsedText;
var strParsedText;
var boolBoldHeaders = true;
var boolBoldFooter = false;
var boolCenterText = true;
var boolFormatNumbers = false;
var oldValOfText = "";

$("#checkBoldHeader").on('change click', function()
{
    if ($(this).prop('checked'))
    {
        boolBoldHeaders = true;
    }
    else
    {
        boolBoldHeaders = false;
    }
    oldValOfText = '';
    processPastedText($("#pastedText").val());
});

$("#checkBoldFooter").on('change click', function()
{
    if ($(this).prop('checked'))
    {
        boolBoldFooter = true;
    }
    else
    {
        boolBoldFooter = false;
    }
    oldValOfText = '';
    processPastedText($("#pastedText").val());
});

$("#checkCenterText").on('change', function()
{
    if ($(this).is(':checked'))
    {
        boolCenterText = true;
    }
    else
    {
        boolCenterText = false;
    }
    oldValOfText = '';
    processPastedText($("#pastedText").val());
});

$("#checkFormatNumbers").on('change', function()
{
    if ($(this).is(':checked'))
    {
        boolFormatNumbers = true;
    }
    else
    {
        boolFormatNumbers = false;
    }
    oldValOfText = '';
    processPastedText($("#pastedText").val());
});

$("#pastedText").on('change keyup paste', function()
{
    processPastedText($(this).val());
});

function processPastedText(currentVal)
{
    if (currentVal == oldValOfText)
    {
        return; //check to prevent multiple simultaneous triggers
    }
    oldValOfText = currentVal;

    $("#tableResult").val('');
    arrParsedText = guessDelimParse(currentVal);
    console.debug(arrParsedText);
    if (arrParsedText === "error")
    {
        $("#tableResult").val("Error! Make sure you're pasting from Excel or pasting a comma- or tab-separated table.\n\nIf you're pasting output from CLOC, only select the 'table' part, which begins and ends with ----------");
        $("#copyError").show();
        $("#copySuccess").hide();
        $("#previewSuccess").hide();
        $("#markdownResult").html('');
    }
    else
    {
        var strParsedText = arrayToMarkdownTable(arrParsedText);
        $("#tableResult").val(strParsedText);
        $("#tableResult").select();
        $("#copyError").hide();
        $("#copySuccess").show();
        $("#previewSuccess").show();
        createMarkdownResult(strParsedText);
    }
}

function arrayToMarkdownTable(arrText)
{
    var strTableOutput = "";
    var arrSecondLine = [];
    for (var i = 0; i < arrText.length; i++)
    {
        var curLine = arrText[i];
        if (typeof(arrText[i][curLine.length - 1]) == "undefined")
        {
            break;
        }
        /////////////       Before combining, escape stuff      /////////////
        for (var j = 0; j < curLine.length; j++)
        {
            var curVal = curLine[j];
            /////////////       Escape underscores      /////////////
            if (typeof(curVal) == "undefined")
            {
                curVal = "u";
            }
            else if (curVal.length === 0)
            {
                curVal = " ";
            }
            else if ($.isNumeric(curVal) && boolFormatNumbers)
            {
                curVal = numberWithCommas(curVal.trim());
            }
            curVal.replace(/_/g, "\\\_");
            if (i == 0)
            {
                if (boolBoldHeaders === true)
                {
                    curVal = "**" + curVal + "**";
                }
                // In here so it's done right after the header
                if (boolCenterText === true)
                {
                    arrSecondLine.push(":-----:");
                }
                else
                {
                    arrSecondLine.push("-----");
                }
            }
            if (((i >= (arrText.length - 1)) || (typeof(arrText[i + 1][curLine.length - 1]) == "undefined")) && (boolBoldFooter == true))
            {
                curVal = "**" + curVal + "**";
            }
            arrText[i][j] = curVal;
        }
        var curLine = arrText[i];
        var strCurLine = curLine.join("|");

        if (i > 0)
        {
            strTableOutput += "\n";
        }
        strTableOutput += strCurLine;
        if (i == 0)
        {
            strTableOutput += "\n" + arrSecondLine.join("|");
        }
    }
    return strTableOutput;
}

function guessDelimParse(textToParse)
{
    var linesT = textToParse.split("\n");
    var linesC = textToParse.split("\n");

    var countTabs = linesT[0].split("\t").length;
    var countCommas = linesT[0].split(",").length;
    var countDashes = linesT[0].split("-").length;
    var countSpaces = linesT[0].split(" ").length;

    if (linesT[0].indexOf("http://cloc.sourceforge.net") != -1)
    {
        return "error";
    }
    else if ((countTabs <= 1) && (countCommas <= 1) && (countDashes <= 1) && (countSpaces <= 1))
    {
        return "error";
    }
    else if ((countDashes > countCommas) && (countDashes > countTabs))
    {
        return clocJSON(textToParse);
    }
    else if (countCommas > 1)
    {
        return csvJSON(textToParse);
    }
    else if (countTabs > 1)
    {
        return tsvJSON(textToParse);
    }
    else
    {
        var countTabs2 = linesT[1].split("\t").length;
        var countCommas2 = linesT[1].split(",").length;
        var countDashes2 = linesT[1].split("-").length;

        if ((countTabs2 == countTabs) && (countTabs2 > 1))
        {
            return tsvJSON(textToParse);
        }
        else if ((countCommas2 == countCommas) && (countCommas2 > 1))
        {
            return csvJSON(textToParse);
        }
        else if ((countDashes2 == countDashes) && (countDashes2 > 1))
        {
            return clocJSON(textToParse);
        }
        else
        {
            return ssvJSON(textToParse);
        }
    }
}

function tsvJSON(tsv)
{
    console.log("Assuming TSV");
    var lines = tsv.split("\n");
    var result = [];
    var headers = lines[0].split("\t");
    for (var i = 0; i < lines.length; i++)
    {
        var obj = [];
        var currentline = lines[i].split("\t");
        for (var j = 0; j < headers.length; j++)
        {
            obj.push(currentline[j]);
        }
        result.push(obj);
    }
    return result;
}

function csvJSON(csv)
{
    console.log("Assuming CSV");
    var lines = csv.split("\n");
    var result = [];
    var headers = lines[0].split(",");
    for (var i = 0; i < lines.length; i++)
    {
        var obj = [];
        var currentline = lines[i].split(",");
        for (var j = 0; j < headers.length; j++)
        {
            obj.push(currentline[j]);
        }
        result.push(obj);
    }
    return result;
}
// parse on spaces as delimiter (requires 2+ spaces to split)
function ssvJSON(ssv)
{
    console.log("Assuming SSV");
    var lines = ssv.split("\n");
    var result = [];
    var headers = lines[0].split(/(  )+/);
    // Remove empty columns
    headers = $.map(headers, function(e, i)
    {
        return e.trim().length > 0 ? e.trim() : null;
    });
    for (var i = 0; i < lines.length; i++)
    {
        var obj = [];
        var currentline = $.map(lines[i].split(/(  )+/), function(e, i)
        {
            return e.trim().length > 0 ? e.trim() : null;
        });
        for (var j = 0; j < headers.length; j++)
        {
            obj.push(currentline[j]);
        }
        result.push(obj);
    }
    return result;
}
// Parse the CLI output from cloc (count lines of code: cloc.sourceforge.net)
// Major assumptions: 
//      pasted output will have table-like formatting lines of -------
//      splitting between columns can be accomplished using sequences of 5 spaces, then eliminating any "columns" that have only spaces
function clocJSON(cloc)
{
    console.log("Assuming CLOC");
    var lines = cloc.split("\n");
    var result = [];
    if (lines[0].indexOf("-----") != -1)
    {
        var headers = lines[1].split(/(  )+/);
    }
    else
    {
        var headers = lines[0].split(/(  )+/);
    }
    // Remove empty columns
    headers = $.map(headers, function(e, i)
    {
        return e.trim().length > 0 ? e.trim() : null;
    });
    for (var i = 0; i < lines.length; i++)
    {
        if (lines[i].indexOf("---") != -1)
        {
            continue;
        }

        var obj = [];
        var currentline = $.map(lines[i].split(/(  )+/), function(e, i)
        {
            return e.trim().length > 0 ? e.trim() : null;
        });
        for (var j = 0; j < headers.length; j++)
        {
            obj.push(currentline[j]);
        }
        result.push(obj);
    }
    return result;
}

function numberWithCommas(x)
{
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}