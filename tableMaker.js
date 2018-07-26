function createMarkdownResult(markdownText)
{
    $("#markdownResult").html('');
    var htmlOutput = "";
    if (useTableFormat == 'markdown')
    {
        $('#markdownResult').show();
        $('#previewSuccess').show();
        htmlOutput = micromarkdown.parse(markdownText);
    }
    else
    {
        $('#markdownResult').hide();
        $('#previewSuccess').hide();
    }
    $("#markdownResult").html(htmlOutput);
    $("#markdownResult").width($("#markdownResult table").width());
}

var arrParsedText;
var strParsedText;
var boolBoldHeaders = true;
var boolBoldFooter = false;
var boolCenterText = true;
var boolFormatNumbers = false;
var oldValOfText = "";
var emptyCellBackgroundColor = '';
var headerBackgroundColor = '';
var strTableCaption = '';
var elemColorPickerEmptyCell;
var elemColorPickerHeader;
var elemTableCaption;
var delim = 'auto';

var useTableFormat = 'markdown';
var tableFormat = {
    'wiki':
    {
        escapePattern: '|',
        escapeReplace: "<nowiki>|</nowiki>",
        tableStart: '{| class="wikitable"\n',
        tableStartCenter: '{| class="wikitable" style="text-align: center;"\n',
        tableCaption: '|+',
        tableRow: '\n|-\n',
        headPre: '!',
        headPost: '',
        rowPre: '|',
        rowPost: '',
        headSep: '\n!',
        afterHeader: false,
        afterHeaderContent: '',
        afterHeaderContentCenter: ':-----:',
        afterHeaderContentLeft: ':-----',
        afterHeaderContentRight: '-----:',
        afterHeaderCellSep: '',
        cellSep: '\n|',
        tableEnd: '\n|}',
        boldStart: "'''",
        boldEnd: "'''",
        cellStyleSep: '|',
        allowStyles: true
    },
    'markdown':
    {
        escapePattern: /_/g,
        escapeReplace: "\\\_",
        tableStart: '',
        tableStartCenter: '',
        tableCaption: '',
        tableRow: '\n',
        headPre: '',
        headPost: '',
        rowPre: '',
        rowPost: '',
        headSep: '|',
        afterHeader: true,
        afterHeaderContent: '-----',
        afterHeaderContentCenter: ':-----:',
        afterHeaderContentLeft: ':-----',
        afterHeaderContentRight: '-----:',
        afterHeaderCellSep: '|',
        cellSep: '|',
        tableEnd: '',
        boldStart: '**',
        boldEnd: '**',
        cellStyleSep: '',
        allowStyles: false
    }
};

$(document).ready(function()
{

    if (storageAvailable('localStorage'))
    {
        if (localStorage.getItem('emptyCellBackgroundColor'))
        {
            emptyCellBackgroundColor = localStorage.emptyCellBackgroundColor;
        }
        if (localStorage.getItem('headerBackgroundColor'))
        {
            headerBackgroundColor = localStorage.headerBackgroundColor;
        }
    }

    // Initialize color picker plugin
    elemTableCaption = $("#inpTableCaption");
    elemColorPickerEmptyCell = $("#emptyCellBackgroundColor");
    elemColorPickerHeader = $("#headerBackgroundColor");
    elemColorPickerEmptyCell.spectrum(
        {
            showInput: true,
            showAlpha: true,
            allowEmpty: true,
            preferredFormat: "rgb",
            disabled: true,
            color: emptyCellBackgroundColor
        })
        .on('change', function()
        {
            localStorage.emptyCellBackgroundColor = $(this).val();
            emptyCellBackgroundColor = $(this).val();
            oldValOfText = '';
            processPastedText($("#pastedText").val());
        });

    elemColorPickerHeader.spectrum(
        {
            showInput: true,
            showAlpha: true,
            allowEmpty: true,
            preferredFormat: "rgb",
            disabled: true,
            color: headerBackgroundColor
        })
        .on('change', function()
        {
            localStorage.headerBackgroundColor = $(this).val();
            headerBackgroundColor = $(this).val();
            oldValOfText = '';
            processPastedText($("#pastedText").val());
        });

    elemTableCaption.on('change', function()
    {
        strTableCaption = $(this).val();
        oldValOfText = '';
        processPastedText($("#pastedText").val());
    });

    $("#pastedText, #tableResult").on("focus click", function()
    {
        $(this).select();
    });

});

$("#selectDelimType").on("change", function()
{
    delim = $(this).val();
    processPastedText($("#pastedText").val());
});

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

$("#checkWikiFormat").on('change', function()
{
    if ($(this).is(':checked'))
    {
        useTableFormat = 'wiki';
        elemColorPickerEmptyCell.spectrum('enable');
        elemColorPickerHeader.spectrum('enable');
        elemTableCaption.prop(
        {
            'disabled': false
        });
    }
    else
    {
        useTableFormat = 'markdown';
        elemColorPickerEmptyCell.spectrum('disable');
        elemColorPickerHeader.spectrum('disable');
        elemTableCaption.prop(
        {
            'disabled': true
        });
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
    if ((currentVal == oldValOfText) && (delim == 'auto'))
    {
        return; //check to prevent multiple simultaneous triggers
    }
    oldValOfText = currentVal;

    $("#tableResult").val('');
    arrParsedText = guessDelimParse(currentVal);
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
    var opts = tableFormat[useTableFormat];
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
            curVal = curVal.replace(opts.escapePattern, opts.escapeReplace);
            if (i == 0)
            {
                if (boolBoldHeaders === true)
                {
                    if (curVal.trim().length > 0)
                    {
                        curVal = opts.boldStart + curVal + opts.boldEnd;
                    }
                }
                // In here so it's done right after the header
                if (opts.afterHeader === true)
                {

                    if (boolCenterText === true)
                    {
                        arrSecondLine.push(opts.afterHeaderContentCenter);
                    }
                    else
                    {
                        arrSecondLine.push(opts.afterHeaderContent);
                    }
                }
            }
            if (((i >= (arrText.length - 1)) || (typeof(arrText[i + 1][curLine.length - 1]) == "undefined")) && (boolBoldFooter == true))
            {
                if (curVal.trim().length > 0)
                {
                    curVal = opts.boldStart + curVal + opts.boldEnd;
                }
            }
            if ((emptyCellBackgroundColor.length > 0) && (curVal.trim().length == 0) && (opts.allowStyles == true))
            {
                curVal = 'style="background: ' + emptyCellBackgroundColor + ';"' + opts.cellStyleSep + curVal;
            }
            if ((headerBackgroundColor.length > 0) && (i == 0) && (opts.allowStyles == true))
            {
                curVal = 'style="background: ' + headerBackgroundColor + ';"' + opts.cellStyleSep + curVal;
            }
            arrText[i][j] = curVal;
        }
        var curLine = arrText[i];
        if (i == 0)
        {
            var strCurLine = opts.headPre + curLine.join(opts.headSep) + opts.headPost;
        }
        else
        {
            var strCurLine = opts.rowPre + curLine.join(opts.cellSep) + opts.rowPost;
        }

        if (i > 0)
        {
            strTableOutput += opts.tableRow;
        }
        strTableOutput += strCurLine;
        if ((i == 0) && arrSecondLine.length > 0)
        {
            strTableOutput += "\n" + arrSecondLine.join(opts.cellSep);
        }
    }
    strTableOutput = (boolCenterText === true ? opts.tableStartCenter : opts.tableStart) + (strTableCaption.length > 0 ? opts.tableCaption + strTableCaption + '\n' : '') + strTableOutput + opts.tableEnd;
    return strTableOutput;
}

function guessDelimParse(textToParse)
{
    if (delim != 'auto')
    {
        switch (delim)
        {
            case 'tab':
                return tsvJSON(textToParse);
                break;

            case 'comma':
                return csvJSON(textToParse);
                break;

            case 'space':
                return ssvJSON(textToParse);
                break;

            default:
                return "error";
                break;
        }

    }
    var linesT = textToParse.split("\n");
    var linesC = textToParse.split("\n");

    var countTabs = linesT[0].split("\t").length;
    var countTabs2 = linesT[0].split("\t").length;
    var countCommas = linesT[0].split(",").length;
    var countCommas2 = linesT[0].split(",").length;
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
    else if ((countCommas > 1) && (countCommas == countCommas2))
    {
        return csvJSON(textToParse);
    }
    else if ((countTabs > 1) && (countTabs == countTabs2))
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
    $('#selectDelimType').val('tab');
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
    $('#selectDelimType').val('comma');
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

function ssvJSON(ssv)
{
    console.log("Assuming SSV");
    $('#selectDelimType').val('space');
    var lines = ssv.split("\n");
    var result = [];
    var headers = lines[0].split(' ');
    // Remove empty columns
    headers = $.map(headers, function(e, i)
    {
        return e.trim().length > 0 ? e.trim() : null;
    });
    for (var i = 0; i < lines.length; i++)
    {
        var obj = [];
        var currentline = $.map(lines[i].split(' '), function(e, i)
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
    $('#selectDelimType').val('auto');
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

function storageAvailable(type)
{
    try
    {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch (e)
    {
        return false;
    }
}
