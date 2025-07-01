import { createTheme, ThemeProvider } from '@mui/material/styles';
import photoPic from './Vector.png';

const theme = createTheme({
    palette: {
        background: {
            default: "Black"
        },
    },
    typography: {
        fontFamily: [
            'Baloo Bhai',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif'
        ].join(',')
    }
});

const theme2 = createTheme({
    palette: {
        background: {
            default: "white"
        },
    },
    typography: {
        fontFamily: [
            'Baloo Bhai',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif'
        ].join(',')
    },
    components: {
        MuiCssBaseline: {
          styleOverrides: `
             body {
              width: 1;
              height: 300px;
              // background-color: skyblue;
              background-image: url(${photoPic});
              background-repeat: no-repeat;
              background-position: left top;
            }
          `,
        },
      },
});

export {theme2,theme}
