import { useState, useEffect, useRef } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Button,
  Container,
  List,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Autocomplete,
  Chip,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import { theme3 } from "../assets/theme";
import PinInput from "react-pin-input";
import axios from "axios";
// import { DateRangePicker } from "@mui/x-date-pickers-pro";
import dayjs, { Dayjs } from "dayjs";
import ClipLoader from "react-spinners/ClipLoader";

import Pagination from "@mui/material/Pagination";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css";
import { DateRangePicker } from "react-date-range";

import "../assets/css/report.css";
import {
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOffer";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SearchIcon from "../assets/searchIcon.png";
import freeIcon from "../assets/freeIcon.png";
import freeNoSelected from "../assets/freeNoSelected.png";
import RefreshIcon from "@mui/icons-material/Refresh";
import moneyGray from "../assets/moneyGray.png";
import moneyGold from "../assets/moneyGold.png";
import carenda from "../assets/calendar.png";

import save from "../assets/saveNew.png";

function Report() {
  // const [dataTransaction, setDataTransaction] = useState([]);
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [value, setValue] = useState("");
  const [machineName, setMachineName] = useState("");
  const [couponDesc, setCouponDesc] = useState("");
  const [selectedMachineNo, setSelectedMachineNo] = useState([]);
  const [selectedpaymentType, setSelectedPaymentType] = useState([]);
  const [selectedcouponType, setSelectedCouponType] = useState([]);
  const [selectedReprint, setSelectedReprint] = useState(null);
  const [filter, setFilter] = useState(false);
  const [rows, setRows] = useState([]);

  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [countRowPage, setCountRowPage] = useState(1);
  const [countRowAll, setCountRowAll] = useState(0);
  const [allDataPage, setAllDataPage] = useState(0);
  const scrollRef = useRef(null);
  const scrollRef1 = useRef(null);
  const scrollRef2 = useRef(null);
  const calendarRef = useRef(null);

  const [ranges, setRanges] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  console.log(selectedStart, selectedEnd, rows)

  const [open, setOpen] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleSelect = (item) => {
    if (!item?.selection) return;
    setRanges([item.selection]);
    setSelectedStart(
      dayjs(item.selection.startDate).format("YYYY-MM-DD HH:mm:ss"),
    );
    setSelectedEnd(dayjs(item.selection.endDate).format("YYYY-MM-DD HH:mm:ss"));
    setIsSelected(true);
  };

  const optionsPaymentType = [
    { value: "DP", label: "Bank Transfer" },
    { value: "CC", label: "Credit Card" },
    { value: "NONE", label: "None" },
  ];

  const optionsCouponType = [
    { value: "FREE", label: "Free" },
    { value: "DC", label: "Discount" },
    { value: "NONE", label: "None" },
  ];

  const optionsMachineNo = [
    { value: "00", label: "K00" },
    { value: "01", label: "K01" },
    { value: "05", label: "K05" },
    { value: "07", label: "K07" },
    { value: "09", label: "K09" },
    { value: "11", label: "K11" },
    { value: "12", label: "K12" },
    { value: "14", label: "K14" },
    { value: "15", label: "K15" },
    { value: "60", label: "A60" },
    { value: "61", label: "A61" },
    { value: "62", label: "A62" },
    { value: "63", label: "A63" },
    { value: "64", label: "A64" },
    { value: "65", label: "A65" },
    { value: "66", label: "A66" },
    { value: "81", label: "B81" },
    { value: "82", label: "B82" },
    { value: "83", label: "B83" },
    { value: "84", label: "B84" },
    { value: "85", label: "B85" },
    { value: "86", label: "B86" },
    { value: "40", label: "T40" },
    { value: "41", label: "T41" },
    { value: "42", label: "T42" },
    { value: "43", label: "T43" },
    { value: "44", label: "T44" },
    { value: "45", label: "T45" },
    { value: "46", label: "T46" },
    { value: "47", label: "T47" },
    { value: "48", label: "T48" },
    { value: "50", label: "T50" },
    { value: "51", label: "F51" },
    { value: "52", label: "F52" },
    { value: "53", label: "F53" },
  ];

  const optionsReprint = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollLeft = el.scrollWidth;
    }
  }, [selectedMachineNo]);

  useEffect(() => {
    if (scrollRef1.current) {
      const el = scrollRef1.current;
      el.scrollLeft = el.scrollWidth;
    }
  }, [selectedpaymentType]);

  useEffect(() => {
    if (scrollRef2.current) {
      const el = scrollRef2.current;
      el.scrollLeft = el.scrollWidth;
    }
  }, [selectedcouponType]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const dataToApp = async () => {
    try {
      const result = await axios.get(
        `${import.meta.env.VITE_APIHUB_URL}/report/list?limit=${limit}&offset=${offset}`
        // `http://localhost:8000/report/list?limit=${limit}&offset=${offset}`,
      );
      // setCount(result.data?.data?.count);
      // setDataTransaction(result.data?.data?.rows);
      const data = result.data?.data?.rows.map((r) => ({
        ...r,
        fullAmount: Number(r.fullAmount).toFixed(2),
        discountAmount: Number(r.discountAmount).toFixed(2),
      }));
      setRows(data);
      setTotal(Math.ceil(result.data?.data?.count / 100));
      setAllDataPage(result.data?.data?.count);
      setCountRowAll(page * limit);
      setCountRowPage(page * limit - 99);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setOffset(page * 100 - 100);
    setLimit(100);
  }, [page]);

  useEffect(() => {
    const goData = async () => {
      try {
        if (filter === true) {
          await multiFilter();
        } else {
          await dataToApp();
        }
      } catch (error) {
        console.error(error);
      }
    };
    setLoading(true);
    goData();
  }, [offset, limit]);

  useEffect(() => {
    setLoading(false);
  }, [rows]);

  const multiFilter = async () => {
    try {
      const resultData = await axios.post(
        `${import.meta.env.VITE_APIHUB_URL}/report/filter`,
        // `http://localhost:8000/report/filter`,
        {
          value,
          selectedMachineNo,
          selectedpaymentType,
          selectedcouponType,
          offset,
          limit,
          selectedStart,
          selectedEnd,
          selectedReprint,
          machineName,
          couponDesc,
        },
      );
      setTotal(Math.ceil(resultData.data?.data?.count / 100));
      const data = resultData.data?.data?.rows.map((r) => ({
        ...r,
        fullAmount: Number(r.fullAmount).toFixed(2),
        discountAmount: Number(r.discountAmount).toFixed(2),
      }));
      setRows(data);
      setAllDataPage(resultData.data?.data?.count);
      setCountRowAll(page * limit);
      setCountRowPage(page * limit - 99);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmSelected = () => {
    multiFilter();
    setFilter(true);
    setPage(1);
    setOpen(false);
    setLoading(true);
  };

  const clear = async () => {
    if (
      selectedMachineNo.length === 0 &&
      selectedpaymentType.length === 0 &&
      selectedcouponType.length === 0 &&
      value === "" &&
      selectedStart === null &&
      selectedReprint === null &&
      machineName === "" &&
      couponDesc === ""
    )
      return;
    await clearHandle();
    console.log(page);
    dataToApp();
    setFilter(false);
  };

  const clearHandle = async () => {
    setOpen(false);
    setSelectedCouponType([]);
    setSelectedPaymentType([]);
    setSelectedMachineNo([]);
    setPage(1);
    setTotal(0);
    setOffset(0);
    setLimit(100);
    setValue("");
    setSelectedStart(null);
    setSelectedEnd(null);
    setSelectedReprint(null);
    setIsSelected(false);
    setLoading(true);
    setFilter(false);
    setMachineName("");
    setCouponDesc("");
    setRanges([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ]);
  };

  const download = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APIHUB_URL}/report/list/download`,
        // "http://localhost:8000/report/list/download",
        {
          selectedMachineNo,
          selectedpaymentType,
          selectedcouponType,
          allDataPage,
          selectedReprint,
          selectedStart,
          selectedEnd,
          value,
        },
        {
          responseType: "blob",
        },
      );
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "report.xlsx";
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
    }
  };

  const refresh = async () => {
    await clearHandle();
    dataToApp();
    setFilter(false);
    setIsSelected(false);
    setOpen(false);
  };

  return (
        <ThemeProvider theme={theme3}>
          <CssBaseline enableColorScheme />
          <Container
            maxWidth={false}
            disableGutters
            component="main"
            sx={{
              // width: "100vw",
              // height: "100vh",
              // display: "flex",
              // flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Box className="box-all-box-report">
              <Box className="header-report">
                <Box className="box-filter-header-report">
                  <FormControl
                    className="formcon-start-report"
                    ref={calendarRef}
                  >
                    <Box className="date-input" onClick={() => setOpen(!open)}>
                      <Typography className="date-text">
                        {!isSelected ? (
                          <div>
                            <div className="date-inline">
                              <div>
                                <img src={carenda} width={16} height={16} />
                              </div>
                              Date Range
                            </div>
                          </div>
                        ) : (
                          `${dayjs(ranges[0].startDate).format("DD/MM/YYYY")} - 
     ${dayjs(ranges[0].endDate).format("DD/MM/YYYY")}`
                        )}
                      </Typography>
                    </Box>

                    <Box className={`calendar-box ${open ? "show" : ""}`}>
                      <DateRangePicker
                        ranges={ranges}
                        onChange={handleSelect}
                        maxDate={new Date()}
                        showDateDisplay={false}
                        moveRangeOnFirstSelection={false}
                      />
                    </Box>
                  </FormControl>

                  <FormControl className="formcon-machine-report">
                    <Box className="formcon-machine-report-in" ref={scrollRef}>
                      <Autocomplete
                        multiple
                        disableCloseOnSelect
                        options={optionsMachineNo}
                        value={optionsMachineNo.filter((opt) =>
                          selectedMachineNo.includes(opt.value),
                        )}
                        isOptionEqualToValue={(option, value) =>
                          option.value === value.value
                        }
                        getOptionLabel={(option) => option.label}
                        onChange={(event, newValue) => {
                          setSelectedMachineNo(
                            newValue.map((item) => item.value),
                          );
                        }}
                        renderOption={(props, option, { selected }) => (
                          <li {...props}>
                            <Checkbox checked={selected} sx={{ mr: 1 }} />
                            {option.label}
                          </li>
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              key={option.value}
                              label={option.label}
                              size="small"
                              {...getTagProps({ index })}
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Machine No."
                            size="small"
                          />
                        )}
                      />
                    </Box>
                  </FormControl>

                  <FormControl className="formcon-search-report">
                    <TextField
                      label={
                        <span className="text-search-img">Machine Name</span>
                      }
                      className="coupon-desc-input"
                      // placeholder="Machine Name"
                      variant="outlined"
                      size="small"
                      value={machineName}
                      onChange={(e) => setMachineName(e.target.value)}
                    />
                  </FormControl>

                  <FormControl className="formcon-payment-report">
                    <Box className="formcon-payment-report-in" ref={scrollRef1}>
                      <Select
                        className="selected-report"
                        multiple
                        displayEmpty
                        value={selectedpaymentType}
                        onChange={(e) =>
                          setSelectedPaymentType(
                            typeof e.target.value === "string"
                              ? e.target.value.split(",")
                              : e.target.value,
                          )
                        }
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return "Payment Type";
                          }

                          return (
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}
                            >
                              {selected.map((value) => {
                                const label =
                                  optionsPaymentType.find(
                                    (p) => p.value === value,
                                  )?.label || value;

                                return (
                                  <Chip
                                    key={value}
                                    label={label}
                                    onDelete={() =>
                                      setSelectedPaymentType((prev) =>
                                        prev.filter((item) => item !== value),
                                      )
                                    }
                                    onMouseDown={(event) => {
                                      event.stopPropagation();
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          );
                        }}
                      >
                        {optionsPaymentType.map((payment) => (
                          <MenuItem key={payment.value} value={payment.value}>
                            <Checkbox
                              checked={selectedpaymentType.includes(
                                payment.value,
                              )}
                            />
                            <ListItemText primary={payment.label} />
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>
                  </FormControl>
                </Box>
              </Box>

              <Box className="header-report2">
                <Box className="box-filter-header-report2">
                  <FormControl className="formcon-coupon-report">
                    <Box className="formcon-coupon-report-in" ref={scrollRef2}>
                      <Select
                        className="selected-report"
                        multiple
                        displayEmpty
                        value={selectedcouponType}
                        onChange={(e) =>
                          setSelectedCouponType(
                            typeof e.target.value === "string"
                              ? e.target.value.split(",")
                              : e.target.value,
                          )
                        }
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return "Coupon Type";
                          }

                          return (
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}
                            >
                              {selected.map((value) => {
                                const label =
                                  optionsCouponType.find(
                                    (p) => p.value === value,
                                  )?.label || value;

                                return (
                                  <Chip
                                    key={value}
                                    label={label}
                                    onDelete={() =>
                                      setSelectedCouponType((prev) =>
                                        prev.filter((item) => item !== value),
                                      )
                                    }
                                    onMouseDown={(event) => {
                                      event.stopPropagation();
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          );
                        }}
                      >
                        {optionsCouponType.map((coupon) => (
                          <MenuItem key={coupon.value} value={coupon.value}>
                            <Checkbox
                              checked={selectedcouponType.includes(
                                coupon.value,
                              )}
                            />
                            <ListItemText primary={coupon.label} />
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>
                  </FormControl>

                  <FormControl className="formcon-search-report">
                    <TextField
                      label={
                        <span className="text-search-img">Coupon Desc</span>
                      }
                      className="coupon-desc-input"
                      // placeholder="Coupon Desc"
                      variant="outlined"
                      size="small"
                      value={couponDesc}
                      onChange={(e) => setCouponDesc(e.target.value)}
                    />
                  </FormControl>

                  <FormControl className="formcon-reprint-report">
                    <Select
                      className="selected-report"
                      displayEmpty
                      value={selectedReprint || ""}
                      renderValue={(selectedReprint) => {
                        if (selectedReprint === "" || selectedReprint == null)
                          return "Reprint";
                        const found = optionsReprint.find(
                          (m) => m.value === selectedReprint,
                        );
                        return found ? found.label : "Reprint";
                      }}
                    >
                      {optionsReprint.map((reprint) => (
                        <MenuItem
                          key={reprint.value}
                          value={reprint.value}
                          onClick={() => {
                            setSelectedReprint((prev) =>
                              prev === reprint.value ? null : reprint.value,
                            );
                          }}
                        >
                          <ListItemText
                            primary={<span>{reprint?.label}</span>}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl className="formcon-search-report">
                    <TextField
                      label={
                        <span className="text-search-img">
                          <img
                            src={SearchIcon}
                            alt="search"
                            width={14}
                            height={14}
                          />
                          Search...
                        </span>
                      }
                      variant="outlined"
                      size="small"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </FormControl>

                  <Button
                    className="buttom-report"
                    onClick={() => confirmSelected()}
                  >
                    Apply
                  </Button>
                  <Button
                    className="buttom-report-clear"
                    onClick={() => clear()}
                  >
                    Clear Filter
                  </Button>
                  <Box className="box-button-header-report">
                    <Button
                      className="button-download-report"
                      onClick={() => download()}
                    >
                      <img
                        src={save}
                        alt="thumbnail"
                        className="img-for-save"
                      />
                    </Button>
                    <Button
                      className="button-download-report"
                      onClick={() => refresh()}
                    >
                      <RefreshIcon
                        sx={{
                          color: "black",
                        }}
                      />
                    </Button>
                  </Box>
                </Box>
              </Box>

              <Box className="box-body-report">
                <TableContainer
                  component={Paper}
                  className="table-contrain-report"
                >
                  <Table size="small" stickyHeader>
                    {loading ? (
                      <div className="loading-in-report">
                        <ClipLoader
                          color="#f4f0d3"
                          loading={loading}
                          size={100}
                        />
                      </div>
                    ) : (
                      <>
                        <TableHead>
                          <TableRow>
                            <TableCell
                              align="center"
                              className="table-cell-mchine-no"
                            >
                              Transaction ID
                            </TableCell>
                            <TableCell
                              align="center"
                              className="table-cell-phone-no"
                            >
                              Phone No.
                            </TableCell>
                            <TableCell
                              align="center"
                              className="table-cell-mchine-no"
                            >
                              Machine No.
                            </TableCell>
                            <TableCell
                              align="center"
                              className="table-cell-mchine-no"
                            >
                              Machine Name
                            </TableCell>
                            <TableCell
                              align="center"
                              className="table-cell-full"
                            >
                              Full AMT
                            </TableCell>
                            <TableCell
                              align="center"
                              className="table-cell-net"
                            >
                              Net AMT
                            </TableCell>
                            <TableCell
                              align="center"
                              className="table-cell-mchine-no"
                            >
                              Coupon Type
                            </TableCell>
                            <TableCell
                              align="center"
                              className="table-cell-mchine-no"
                            >
                              Coupon Code
                            </TableCell>
                            <TableCell
                              align="center"
                              className="table-cell-mchine-no"
                            >
                              Coupon Desc
                            </TableCell>
                            <TableCell
                              align="center"
                              className="table-cell-mchine-no"
                            >
                              Payment Type
                            </TableCell>
                            <TableCell
                              align="center"
                              className="table-cell-mchine-no"
                            >
                              Transaction At
                            </TableCell>
                            <TableCell
                              align="center"
                              className="table-cell-copies"
                            >
                              Reprint
                            </TableCell>
                            <TableCell
                              align="center"
                              className="table-cell-copies"
                            >
                              Copies
                            </TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {rows?.map((row, index) => (
                            <TableRow key={row.tId || index}>
                              <TableCell align="center">
                                {row.transactionId || "-"}
                              </TableCell>
                              <TableCell align="center">
                                {row.phoneNo || "-"}
                              </TableCell>
                              <TableCell align="center">
                                {row.machineNo || "-"}
                              </TableCell>
                              <TableCell align="center">
                                {row.machineName || "-"}
                              </TableCell>
                              <TableCell align="center">
                                {row.fullAmount || "-"}
                              </TableCell>
                              <TableCell align="center">
                                {row.discountAmount || "-"}
                              </TableCell>
                              <TableCell align="center">
                                <LocalOfferOutlinedIcon
                                  sx={{
                                    stroke:
                                      row.couponType === "DC"
                                        ? "#C70EEC"
                                        : "#9C9C9C",
                                    fill: "none",
                                    strokeWidth: 2,
                                  }}
                                />{" "}
                                <img
                                  src={
                                    row.couponType === "FREE"
                                      ? freeIcon
                                      : freeNoSelected
                                  }
                                  alt="free"
                                  width={24}
                                  height={24}
                                />
                              </TableCell>
                              <TableCell align="center">
                                {row.couponCode || "-"}
                              </TableCell>
                              <TableCell align="center">
                                {row.couponDesc || "-"}
                              </TableCell>
                              <TableCell align="center">
                                <CreditCardIcon
                                  sx={{
                                    color:
                                      row.paymentType === "CC"
                                        ? "#38A9F4"
                                        : "#9C9C9C",
                                  }}
                                />{" "}
                                <img
                                  src={
                                    row.paymentType === "DP"
                                      ? moneyGold
                                      : moneyGray
                                  }
                                  alt="DP"
                                  width={24}
                                  height={24}
                                />
                              </TableCell>
                              <TableCell align="center">
                                {row.createdAt}
                              </TableCell>
                              <TableCell align="center">
                                <Checkbox
                                  checked={Boolean(row.isreprinted)}
                                  disabled
                                  icon={
                                    <span
                                      style={{
                                        width: 18,
                                        height: 18,
                                        border: "2px solid #9C9C9C",
                                        borderRadius: 2,
                                        display: "inline-block",
                                        backgroundColor: "white",
                                      }}
                                    />
                                  }
                                  checkedIcon={
                                    <span
                                      style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: 4,
                                        backgroundColor: "#22C55E",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <CheckIcon
                                        sx={{ fontSize: 14, color: "white" }}
                                      />
                                    </span>
                                  }
                                />
                              </TableCell>
                              <TableCell align="center">{row.copies}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        {rows?.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={12} align="center">
                              ไม่พบข้อมูล
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </Table>
                </TableContainer>
              </Box>

              <Box className="footer-report">
                <Grid className="grid-footer-report">
                  <Typography>
                    Showing {countRowPage} to{" "}
                    {countRowAll > allDataPage ? allDataPage : countRowAll} of{" "}
                    {allDataPage} entries
                  </Typography>
                </Grid>
                <Grid className="grid-footer-report">
                  <Pagination
                    variant="outlined"
                    shape="rounded"
                    count={total}
                    page={page}
                    onChange={(event, page) => {
                      setPage(page);
                    }}
                  />
                </Grid>
              </Box>
            </Box>
          </Container>
        </ThemeProvider>
  );
}

export default Report;
